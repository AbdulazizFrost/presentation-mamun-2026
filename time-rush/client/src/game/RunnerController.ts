import * as THREE from 'three';
import type { TeamId, TeamRoundResult, TeamSnapshot } from '@shared/types/game';
import { DoorView } from './DoorView';
import { afterZ, gateZ, laneX, startZ, stopZ } from './layout';
import { TEAM_COLORS } from './palette';
import type { RunnerAnimator, RunnerPose } from './RunnerAnimator';
import { PrimitiveRunnerView, type RunnerView } from './RunnerView';
import { blobShadowTexture } from './textures';

export type RunnerState = 'IDLE' | 'RUNNING' | 'WAITING_AT_DOOR' | 'PASSING_DOOR' | 'COLLIDING' | 'RESPAWNING' | 'FINISHED';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const easeOut = (t: number) => 1 - (1 - t) ** 2;
const span = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));
/** Overshoots a little before settling at 1 — a "pop". */
const easeOutBack = (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;

interface Gate {
  door: DoorView;
  index: number;
  /** Round id whose result is currently painted on this gate. */
  shows: string | null;
}

/** Expanding ring used for the respawn and pass-through effects. */
class Burst {
  readonly mesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  private age = 1;

  constructor(color: number) {
    this.mesh = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.75, 40),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
    );
    this.mesh.rotation.x = -Math.PI / 2;
  }

  fire(x: number, z: number): void {
    this.mesh.position.set(x, 0.06, z);
    this.age = 0;
  }

  update(dt: number): void {
    this.age = Math.min(1, this.age + dt * 1.6);
    this.mesh.scale.setScalar(1 + this.age * 3);
    this.mesh.material.opacity = (1 - this.age) * 0.9;
  }
}

/**
 * One team's race in 3D. Everything is derived from the authoritative TeamSnapshot and the server
 * clock (phase end + duration), so the runner is always where the server says — even after a reload.
 */
export class RunnerController {
  readonly root = new THREE.Group();
  private view: RunnerView;
  private animator: RunnerAnimator;
  /** Moves along the corridor. */
  private readonly runner = new THREE.Group();
  /** Shrinks and pops the runner for the respawn effect. */
  private readonly body = new THREE.Group();
  private readonly gates: Gate[];
  private readonly burst: Burst;
  private state: RunnerState = 'IDLE';
  private shakenFor: string | null = null;
  private burstFor: string | null = null;
  /** Set to 1 at an impact; the scene reads it for camera shake. */
  impact = 0;
  /** Smoothed speed along the corridor (m/s), for the pace of the run animation. */
  private speed = 0;
  private lastZ = 0;

  constructor(team: TeamId) {
    this.view = new PrimitiveRunnerView(team);
    this.animator = this.view.createAnimator();
    this.body.add(this.view.root);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 1.4),
      new THREE.MeshBasicMaterial({ map: blobShadowTexture(), transparent: true, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    this.runner.add(this.body, shadow);
    this.gates = [0, 1, 2].map((i) => {
      const door = new DoorView(team);
      door.setZ(gateZ(i));
      return { door, index: i, shows: null };
    });
    this.burst = new Burst(TEAM_COLORS[team]);
    this.root.add(this.runner, this.burst.mesh, ...this.gates.map((g) => g.door.root));
  }

  /** Swaps in another runner (e.g. the custom model once it has loaded). */
  setView(view: RunnerView): void {
    this.body.remove(this.view.root);
    this.view = view;
    this.animator = view.createAnimator();
    this.body.add(view.root);
  }

  get currentState(): RunnerState {
    return this.state;
  }

  /** Runner position along the corridor, for the camera. */
  get z(): number {
    return this.runner.position.z;
  }

  /**
   * @param team   the team's latest state (null before the first snapshot)
   * @param now    current server time (ms)
   * @param ended  'won' / 'lost' / 'draw' once the whole game is over
   */
  update(dt: number, team: TeamSnapshot | null, now: number, ended: 'won' | 'lost' | 'draw' | null): void {
    this.impact = Math.max(0, this.impact - dt * 2.5);
    this.burst.update(dt);
    const index = team ? Math.max(0, team.roundIndex) : 0;
    this.placeGates(index);
    // After the last door there are no more gates ahead.
    if (team?.phase === 'FINISHED') for (const g of this.gates) if (g.index > index) g.door.root.visible = false;
    const current = this.gate(index);

    let pose: RunnerPose = 'idle';
    let progress = 0;
    let x = 0;
    let z = 0;
    let scale = 1;
    let hop = 0;

    const phaseTime = (): number => {
      if (!team?.phaseDurationMs) return 1;
      const remaining = team.pausedRemainingMs ?? (team.phaseEndsAt === null ? 0 : Math.max(0, team.phaseEndsAt - now));
      return clamp01(1 - remaining / team.phaseDurationMs);
    };

    switch (team?.phase ?? 'WAITING') {
      case 'WAITING':
        this.state = 'IDLE';
        z = 0;
        current?.door.setVoteShares(null);
        break;

      case 'RUNNING': {
        this.state = 'RUNNING';
        const t = phaseTime();
        z = THREE.MathUtils.lerp(startZ(index), stopZ(index), easeOut(t));
        pose = t < 0.97 ? 'run' : 'idle';
        this.freshGate(current, team);
        break;
      }

      case 'VOTING':
      case 'TIE_BREAK':
        this.state = 'WAITING_AT_DOOR';
        z = stopZ(index);
        this.freshGate(current, team);
        current?.door.setVoteShares(team?.tally ?? null);
        break;

      case 'ANIMATING': {
        const result = team?.lastResult;
        if (!result || result.roundIndex !== index || !current) {
          z = stopZ(index);
          break;
        }
        const t = phaseTime();
        if (result.outcome === 'correct') ({ x, z, pose, hop } = this.passThrough(current, result, t));
        else ({ x, z, pose, progress, scale } = this.crash(current, result, t));
        break;
      }

      case 'FINISHED':
        this.state = 'FINISHED';
        // Well past the last gate; the camera swings round to show the runner from the front.
        z = afterZ(Math.max(0, (team?.completedRounds ?? 1) - 1)) - 10;
        pose = ended === 'lost' ? 'sad' : ended ? 'cheer' : team?.finishRank === 1 ? 'cheer' : 'idle';
        break;
    }

    // Smooth sideways motion; z follows the timeline exactly (it is already continuous).
    this.runner.position.x = THREE.MathUtils.lerp(this.runner.position.x, x, 1 - Math.exp(-dt * 8));
    this.runner.position.z = z;
    this.runner.position.y = hop;
    this.body.scale.setScalar(Math.max(0.001, scale));
    this.body.rotation.y = scale < 1 ? (1 - scale) * Math.PI * 2 : 0;
    if (dt > 0) {
      const v = Math.min(30, Math.abs(z - this.lastZ) / dt);
      this.speed = THREE.MathUtils.lerp(this.speed, v, 1 - Math.exp(-dt * 8));
    }
    this.lastZ = z;
    this.animator.update(dt, pose, progress, this.speed);
  }

  /** Right door: it opens, the runner goes through and lands behind the gate. */
  private passThrough(gate: Gate, result: TeamRoundResult, t: number) {
    const lane = laneX(result.selectedAnswer ?? 'B');
    const reach = 0.45;
    this.state = t < reach ? 'RUNNING' : 'PASSING_DOOR';
    if (gate.shows !== result.roundId) {
      gate.door.reset();
      gate.door.highlight(result.selectedAnswer);
      gate.shows = result.roundId;
    }
    if (result.selectedAnswer) {
      gate.door.markResult(result.selectedAnswer, 'correct');
      gate.door.setOpen(result.selectedAnswer, span(t, 0.12, 0.42));
    }
    const z = t < reach
      ? THREE.MathUtils.lerp(stopZ(result.roundIndex), gateZ(result.roundIndex) + 0.3, easeInOut(t / reach))
      : THREE.MathUtils.lerp(gateZ(result.roundIndex) + 0.3, afterZ(result.roundIndex), easeOut((t - reach) / (1 - reach)));
    const x = t < 0.8 ? lane : 0;
    const hop = Math.sin(span(t, 0.38, 0.62) * Math.PI) * 0.45;
    if (t > reach && this.burstFor !== result.roundId) {
      this.burstFor = result.roundId;
      this.burst.fire(lane, gateZ(result.roundIndex) - 0.5);
    }
    return { x, z, pose: 'run' as RunnerPose, hop };
  }

  /** Wrong door or no votes: run into it, fall back, vanish and reappear behind the gate. */
  private crash(gate: Gate, result: TeamRoundResult, t: number) {
    const i = result.roundIndex;
    const answer = result.selectedAnswer ?? 'B';
    const lane = laneX(answer);
    if (gate.shows !== result.roundId) {
      gate.door.reset();
      gate.door.highlight(result.selectedAnswer);
      gate.shows = result.roundId;
    }
    const hit = 0.25;
    let pose: RunnerPose = 'run';
    let progress = 0;
    let scale = 1;
    let x = lane;
    let z: number;
    if (t < hit) {
      this.state = 'RUNNING';
      z = THREE.MathUtils.lerp(stopZ(i), gateZ(i) + 0.75, easeInOut(t / hit));
    } else if (t < 0.68) {
      this.state = 'COLLIDING';
      if (this.shakenFor !== result.roundId) {
        this.shakenFor = result.roundId;
        this.impact = 1;
      }
      if (result.selectedAnswer) {
        gate.door.markResult(result.selectedAnswer, 'wrong');
        gate.door.shake(result.selectedAnswer, 1 - span(t, hit, 0.45), t * 4);
      }
      pose = 'fall';
      progress = span(t, hit, 0.5);
      z = gateZ(i) + 0.75 + easeOut(span(t, hit, 0.4)) * 0.9;
      scale = 1 - easeInOut(span(t, 0.55, 0.68));
    } else {
      this.state = 'RESPAWNING';
      if (this.burstFor !== result.roundId) {
        this.burstFor = result.roundId;
        this.burst.fire(0, afterZ(i));
      }
      x = 0;
      z = afterZ(i);
      pose = 'idle';
      const pop = span(t, 0.72, 0.9);
      scale = pop <= 0 ? 0 : easeOutBack(pop);
      this.runner.position.x = 0; // appear in the middle of the lane, no sliding
    }
    // Show which door was right.
    if (t > 0.35) gate.door.markResult(result.correctAnswer, 'correct');
    return { x, z, pose, progress, scale };
  }

  /** Keeps three gates around the runner: the one just passed, the current one and the next. */
  private placeGates(index: number): void {
    const wanted = [index - 1, index, index + 1];
    const free = this.gates.filter((g) => !wanted.includes(g.index));
    for (const target of wanted) {
      if (target < 0 || this.gates.some((g) => g.index === target)) continue;
      const gate = free.shift();
      if (!gate) break;
      gate.index = target;
      gate.shows = null;
      gate.door.reset();
      gate.door.setZ(gateZ(target));
    }
    for (const gate of this.gates) gate.door.root.visible = gate.index >= 0;
  }

  private gate(index: number): Gate | undefined {
    return this.gates.find((g) => g.index === index);
  }

  /** Before a door is answered it must look closed and neutral. */
  private freshGate(gate: Gate | undefined, team: TeamSnapshot | null): void {
    if (!gate || !team?.roundId || gate.shows === `fresh:${team.roundId}`) return;
    gate.door.reset();
    gate.shows = `fresh:${team.roundId}`;
  }
}
