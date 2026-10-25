import * as THREE from 'three';
import type { RunnerRig } from './RunnerView';

export type RunnerPose = 'idle' | 'run' | 'fall' | 'getUp' | 'cheer' | 'sad';

/**
 * Drives a runner for a given pose. `progress` (0..1) is used by one-shot poses (fall, getUp);
 * `speed` is how fast the runner moves along the corridor (m/s).
 */
export interface RunnerAnimator {
  update(dt: number, pose: RunnerPose, progress: number, speed: number): void;
}

const lerp = THREE.MathUtils.lerp;

/** Procedural limb animation for the primitive runner. */
export class ProceduralRunnerAnimator implements RunnerAnimator {
  private phase = 0;

  constructor(private readonly rig: RunnerRig) {}

  update(dt: number, pose: RunnerPose, progress: number): void {
    const { body, head, leftArm, rightArm, leftLeg, rightLeg, root } = this.rig;
    const smooth = 1 - Math.exp(-dt * 12);
    let swing = 0;
    let bob = 0;
    let lean = 0;
    let fallTilt = 0;
    let armRaise = 0;
    let headDrop = 0;

    switch (pose) {
      case 'run':
        this.phase += dt * 11;
        swing = Math.sin(this.phase) * 0.9;
        bob = Math.abs(Math.cos(this.phase)) * 0.08;
        lean = -0.14;
        break;
      case 'idle':
        this.phase += dt * 2;
        bob = Math.sin(this.phase) * 0.02;
        break;
      case 'fall':
        fallTilt = lerp(0, 1.2, Math.min(1, progress * 1.6));
        swing = 0.4;
        break;
      case 'getUp':
        fallTilt = lerp(1.2, 0, progress);
        break;
      case 'cheer':
        this.phase += dt * 8;
        armRaise = 1;
        bob = Math.abs(Math.sin(this.phase)) * 0.25;
        break;
      case 'sad':
        this.phase += dt * 2;
        headDrop = 0.4;
        break;
    }

    leftArm.rotation.x = lerp(leftArm.rotation.x, armRaise ? Math.PI * 0.95 : swing, smooth);
    rightArm.rotation.x = lerp(rightArm.rotation.x, armRaise ? Math.PI * 0.95 : -swing, smooth);
    leftArm.rotation.z = lerp(leftArm.rotation.z, armRaise ? -0.35 : 0, smooth);
    rightArm.rotation.z = lerp(rightArm.rotation.z, armRaise ? 0.35 : 0, smooth);
    leftLeg.rotation.x = lerp(leftLeg.rotation.x, -swing * 0.9, smooth);
    rightLeg.rotation.x = lerp(rightLeg.rotation.x, swing * 0.9, smooth);
    body.rotation.x = lerp(body.rotation.x, lean, smooth);
    head.rotation.x = lerp(head.rotation.x, headDrop, smooth);
    body.position.y = 0.95 + bob;
    root.rotation.x = fallTilt; // fall backwards, pivoting on the feet
  }
}

/** Animation roles the game asks for; a model provides clips for some or all of them. */
export type ClipRole = 'idle' | 'run' | 'fall' | 'getUp' | 'cheer' | 'sad';

/** Target lengths (ms) of one-shot clips, matching the crash animation on the projector. */
const ONE_SHOT: Partial<Record<ClipRole, number>> = {
  fall: 900,
  getUp: 900,
};

/** Corridor speed (m/s) at which the run clip plays at its own pace; faster runs play it faster. */
const RUN_CLIP_SPEED = 7;

/**
 * Plays the clips of a skinned model with an AnimationMixer and cross-fades between poses.
 * One-shot clips (fall, getUp) are time-scaled to fit the game's animation timing.
 */
export class MixerRunnerAnimator implements RunnerAnimator {
  private readonly mixer: THREE.AnimationMixer;
  private readonly actions = new Map<ClipRole, THREE.AnimationAction>();
  private current: THREE.AnimationAction | null = null;
  private currentPose: RunnerPose | null = null;

  constructor(root: THREE.Object3D, clips: Partial<Record<ClipRole, THREE.AnimationClip>>) {
    this.mixer = new THREE.AnimationMixer(root);
    for (const [role, clip] of Object.entries(clips) as [ClipRole, THREE.AnimationClip | undefined][]) {
      if (!clip) continue;
      const action = this.mixer.clipAction(clip);
      const oneShotMs = ONE_SHOT[role];
      if (oneShotMs) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.timeScale = THREE.MathUtils.clamp(clip.duration / (oneShotMs / 1000), 0.5, 3);
      }
      this.actions.set(role, action);
    }
  }

  private actionFor(pose: RunnerPose): THREE.AnimationAction | null {
    const fallbacks: Record<RunnerPose, ClipRole[]> = {
      idle: ['idle'],
      run: ['run', 'idle'],
      fall: ['fall', 'idle'],
      getUp: ['getUp', 'idle'],
      cheer: ['cheer', 'idle'],
      sad: ['sad', 'idle'],
    };
    for (const role of fallbacks[pose]) {
      const action = this.actions.get(role);
      if (action) return action;
    }
    return null;
  }

  update(dt: number, pose: RunnerPose, _progress: number, speed: number): void {
    // The legs keep pace with the runner: quick steps at full speed, slower ones near a door.
    const run = this.actions.get('run');
    if (run) run.timeScale = THREE.MathUtils.clamp(speed / RUN_CLIP_SPEED, 0.6, 1.6);
    if (pose !== this.currentPose) {
      this.currentPose = pose;
      const next = this.actionFor(pose);
      if (next && next !== this.current) {
        next.reset();
        next.enabled = true;
        next.setEffectiveWeight(1);
        next.play();
        if (this.current) next.crossFadeFrom(this.current, 0.2, false);
        this.current = next;
      }
    }
    this.mixer.update(dt);
  }
}

/**
 * Whole-body animation for a model without a skeleton (e.g. a static FBX/GLB statue):
 * bobbing and leaning while running, falling backwards, jumping for joy.
 * `pivot` must sit at the model's feet.
 */
export class RigidRunnerAnimator implements RunnerAnimator {
  private phase = 0;

  constructor(private readonly pivot: THREE.Object3D) {}

  update(dt: number, pose: RunnerPose, progress: number): void {
    const p = this.pivot;
    const smooth = 1 - Math.exp(-dt * 10);
    let y = 0;
    let tiltX = 0;
    let sway = 0;
    let turn = 0;
    let squash = 1;

    switch (pose) {
      case 'run':
        this.phase += dt * 11;
        y = Math.abs(Math.sin(this.phase)) * 0.14;
        tiltX = -0.14;
        sway = Math.sin(this.phase) * 0.08;
        squash = 1 - Math.abs(Math.cos(this.phase)) * 0.05;
        break;
      case 'idle':
        this.phase += dt * 2.2;
        squash = 1 + Math.sin(this.phase) * 0.012;
        sway = Math.sin(this.phase * 0.5) * 0.02;
        break;
      case 'fall': {
        const t = Math.min(1, progress * 1.4);
        tiltX = 1.35 * (1 - (1 - t) ** 3);
        y = Math.sin(Math.min(1, progress * 2) * Math.PI) * 0.25;
        break;
      }
      case 'getUp':
        tiltX = 1.35 * (1 - progress);
        break;
      case 'cheer':
        this.phase += dt * 9;
        y = Math.abs(Math.sin(this.phase)) * 0.5;
        turn = Math.sin(this.phase * 0.5) * 0.35;
        squash = 1 + Math.abs(Math.cos(this.phase)) * 0.05;
        break;
      case 'sad':
        this.phase += dt * 1.5;
        tiltX = -0.22;
        squash = 0.97;
        break;
    }

    // Falls are driven exactly by progress; everything else eases toward its pose.
    const direct = pose === 'fall' || pose === 'getUp';
    p.rotation.x = direct ? tiltX : THREE.MathUtils.lerp(p.rotation.x, tiltX, smooth);
    p.rotation.z = THREE.MathUtils.lerp(p.rotation.z, sway, smooth);
    p.rotation.y = THREE.MathUtils.lerp(p.rotation.y, turn, smooth);
    p.position.y = direct ? y : THREE.MathUtils.lerp(p.position.y, y, Math.min(1, smooth * 2));
    p.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
  }
}
