import * as THREE from 'three';
import { ANSWER_IDS, type AnswerId, type TeamId, type VoteTally } from '@shared/types/game';
import { LAYOUT } from './layout';
import { PALETTE, TEAM_COLORS, teamColor } from './palette';
import { doorBadgeTexture } from './textures';

interface Door {
  answer: AnswerId;
  group: THREE.Group;
  panel: THREE.Mesh<THREE.ExtrudeGeometry, THREE.MeshStandardMaterial>;
  rim: THREE.Mesh<THREE.TorusGeometry, THREE.MeshStandardMaterial>;
  cross: THREE.Group;
  baseX: number;
}

/**
 * The gate at the end of a team's corridor: a wall with three arched doors (A, B, C) and letter badges.
 * Exposes visual operations only; the RunnerController decides the timing.
 */
export class DoorView {
  readonly root = new THREE.Group();
  private readonly doors: Door[] = [];
  private readonly color: THREE.Color;

  constructor(team: TeamId) {
    this.color = teamColor(team);
    const { doorWidth: w, doorHeight: h, corridorHalfWidth: halfW, corridorHeight: height } = LAYOUT;
    const hex = `#${TEAM_COLORS[team].toString(16).padStart(6, '0')}`;

    // Gate wall: one extruded shape with three arched openings.
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5264, roughness: 0.45, metalness: 0.65 });
    const wallShape = new THREE.Shape();
    wallShape.moveTo(-halfW, 0);
    wallShape.lineTo(halfW, 0);
    wallShape.lineTo(halfW, height);
    wallShape.lineTo(-halfW, height);
    wallShape.lineTo(-halfW, 0);
    for (const answer of ANSWER_IDS) wallShape.holes.push(archPath(LAYOUT.laneOffset[answer], w / 2 + 0.22, h));
    const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(wallShape, { depth: 0.4, bevelEnabled: false }), wallMaterial);
    wall.position.z = -0.45;
    this.root.add(wall);

    const frameMaterial = new THREE.MeshStandardMaterial({ color: PALETTE.doorFrame, roughness: 0.3, metalness: 0.8 });
    const postGeometry = new THREE.BoxGeometry(0.22, h, 0.42);
    const archGeometry = new THREE.TorusGeometry(w / 2 + 0.11, 0.11, 10, 32, Math.PI);
    const rimGeometry = new THREE.TorusGeometry(w / 2 + 0.11, 0.04, 8, 32, Math.PI);
    const panelGeometry = new THREE.ExtrudeGeometry(archShape(w / 2, h), { depth: 0.14, bevelEnabled: false });
    const badgeGeometry = new THREE.PlaneGeometry(0.95, 0.95);
    const crossBar = new THREE.BoxGeometry(1.5, 0.26, 0.08);

    for (const answer of ANSWER_IDS) {
      const baseX = LAYOUT.laneOffset[answer];
      const group = new THREE.Group();
      group.position.x = baseX;

      const left = new THREE.Mesh(postGeometry, frameMaterial);
      left.position.set(-w / 2 - 0.11, h / 2, 0);
      const right = left.clone();
      right.position.x = w / 2 + 0.11;
      const arch = new THREE.Mesh(archGeometry, frameMaterial);
      arch.position.set(0, h, 0);
      const rim = new THREE.Mesh(rimGeometry, new THREE.MeshStandardMaterial({ color: this.color, emissive: this.color, emissiveIntensity: 0.7 }));
      rim.position.set(0, h, 0.2);

      const panel = new THREE.Mesh(
        panelGeometry,
        new THREE.MeshStandardMaterial({ color: PALETTE.doorPanel, roughness: 0.35, metalness: 0.6, emissive: this.color, emissiveIntensity: 0 }),
      );
      panel.position.set(0, 0, -0.12);

      const badge = new THREE.Mesh(
        badgeGeometry,
        new THREE.MeshBasicMaterial({ map: doorBadgeTexture(answer, hex), transparent: true }),
      );
      badge.position.set(0, h + w / 2 + 0.5, 0.25);

      const cross = new THREE.Group();
      const crossMaterial = new THREE.MeshStandardMaterial({ color: PALETTE.wrong, emissive: PALETTE.wrong, emissiveIntensity: 1.2 });
      for (const angle of [Math.PI / 4, -Math.PI / 4]) {
        const bar = new THREE.Mesh(crossBar, crossMaterial);
        bar.rotation.z = angle;
        cross.add(bar);
      }
      cross.position.set(0, h / 2 + 0.3, 0.15);
      cross.visible = false;

      group.add(panel, left, right, arch, rim, badge, cross);
      this.root.add(group);
      this.doors.push({ answer, group, panel, rim, cross, baseX });
    }
  }

  setZ(z: number): void {
    this.root.position.z = z;
  }

  get z(): number {
    return this.root.position.z;
  }

  /** During voting, each door glows with its share of the team's votes. */
  setVoteShares(tally: VoteTally | null): void {
    const total = tally ? tally.A + tally.B + tally.C : 0;
    for (const door of this.doors) {
      const share = tally && total > 0 ? tally[door.answer] / total : 0;
      door.panel.material.emissive.copy(this.color);
      door.panel.material.emissiveIntensity = share * 0.4;
    }
  }

  /** Marks the team's chosen door. */
  highlight(answer: AnswerId | null): void {
    for (const door of this.doors) {
      const selected = door.answer === answer;
      door.panel.material.emissive.copy(this.color);
      door.panel.material.emissiveIntensity = selected ? 0.45 : 0;
      door.rim.material.emissiveIntensity = selected ? 1.5 : 0.7;
    }
  }

  /** Lifts a door panel: 0 = closed, 1 = fully open. */
  setOpen(answer: AnswerId | 'all', progress: number): void {
    const p = THREE.MathUtils.clamp(progress, 0, 1);
    const eased = 1 - (1 - p) ** 3;
    const { doorHeight: h, doorWidth: w } = LAYOUT;
    for (const door of this.doors) {
      if (answer !== 'all' && door.answer !== answer) continue;
      door.panel.position.y = eased * (h + w / 2 + 0.2);
    }
  }

  markResult(answer: AnswerId, kind: 'correct' | 'wrong'): void {
    const door = this.doors.find((d) => d.answer === answer);
    if (!door) return;
    if (kind === 'wrong') {
      door.cross.visible = true;
      door.panel.material.emissive.set(PALETTE.wrong);
      door.panel.material.emissiveIntensity = 0.3;
      door.rim.material.emissive.set(PALETTE.wrong);
    } else {
      door.panel.material.emissive.set(PALETTE.correct);
      door.panel.material.emissiveIntensity = 0.35;
      door.rim.material.emissive.set(PALETTE.correct);
      door.rim.material.emissiveIntensity = 1.4;
    }
  }

  shake(answer: AnswerId, amount: number, time: number): void {
    const door = this.doors.find((d) => d.answer === answer);
    if (door) door.group.position.x = door.baseX + Math.sin(time * 70) * 0.1 * amount;
  }

  reset(): void {
    for (const door of this.doors) {
      door.group.position.x = door.baseX;
      door.cross.visible = false;
      door.rim.material.emissive.copy(this.color);
      door.rim.material.emissiveIntensity = 0.7;
    }
    this.setOpen('all', 0);
    this.highlight(null);
  }
}

/** Door outline: a rectangle of height `h` with a semicircular top, centred on x = 0. */
function archShape(radius: number, h: number): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-radius, 0);
  shape.lineTo(radius, 0);
  shape.lineTo(radius, h);
  shape.absarc(0, h, radius, 0, Math.PI, false);
  shape.lineTo(-radius, 0);
  return shape;
}

/** The same outline as a hole path at horizontal position `x` (holes wind the other way). */
function archPath(x: number, radius: number, h: number): THREE.Path {
  const path = new THREE.Path();
  path.moveTo(x - radius, 0);
  path.lineTo(x - radius, h);
  path.absarc(x, h, radius, Math.PI, 0, true);
  path.lineTo(x + radius, 0);
  path.lineTo(x - radius, 0);
  return path;
}
