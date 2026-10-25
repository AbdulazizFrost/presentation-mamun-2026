import * as THREE from 'three';
import type { TeamId } from '@shared/types/game';
import { PALETTE, TEAM_COLORS } from './palette';
import { ProceduralRunnerAnimator, type RunnerAnimator } from './RunnerAnimator';

/**
 * What the gameplay code needs from a runner: an object to move around and an animator.
 * Implementations: PrimitiveRunnerView (built-in placeholder) and GltfRunnerView (your model).
 */
export interface RunnerView {
  readonly root: THREE.Object3D;
  createAnimator(): RunnerAnimator;
}

/** Named joints of the primitive runner, driven by ProceduralRunnerAnimator. */
export interface RunnerRig {
  root: THREE.Object3D;
  body: THREE.Object3D;
  head: THREE.Object3D;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
}

function limb(geometry: THREE.BufferGeometry, material: THREE.Material, length: number): THREE.Group {
  const pivot = new THREE.Group();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -length / 2;
  pivot.add(mesh);
  return pivot;
}

/** Stylised student (big head, team-coloured hair and jacket, backpack) seen from behind. */
export class PrimitiveRunnerView implements RunnerView {
  readonly root: THREE.Group;
  readonly rig: RunnerRig;

  constructor(team: TeamId) {
    const color = TEAM_COLORS[team];
    const jacket = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
    const hair = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.8), roughness: 0.6 });
    const skin = new THREE.MeshStandardMaterial({ color: PALETTE.skin, roughness: 0.7 });
    const pants = new THREE.MeshStandardMaterial({ color: PALETTE.pants, roughness: 0.7 });
    const shoes = new THREE.MeshStandardMaterial({ color: PALETTE.shoes, roughness: 0.4 });
    const bag = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.45), roughness: 0.6 });

    const root = new THREE.Group();
    const body = new THREE.Group();
    body.position.y = 0.95;
    root.add(body);

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 0.42, 6, 14), jacket);
    torso.position.y = 0.36;
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.5, 0.24), bag);
    backpack.position.set(0, 0.42, 0.3);
    const strapGeometry = new THREE.BoxGeometry(0.06, 0.5, 0.05);
    for (const x of [-0.17, 0.17]) {
      const strap = new THREE.Mesh(strapGeometry, bag);
      strap.position.set(x, 0.45, -0.25);
      body.add(strap);
    }
    body.add(torso, backpack);

    // Big chibi head, as on the mock-up.
    const head = new THREE.Group();
    head.position.y = 1.05;
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), skin);
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), hair);
    hairCap.position.y = 0.04;
    hairCap.rotation.x = 0.25;
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 10), hair);
    tuft.position.set(0.05, 0.36, 0.05);
    tuft.rotation.z = -0.4;
    head.add(face, hairCap, tuft);
    body.add(head);

    const armGeometry = new THREE.CapsuleGeometry(0.075, 0.42, 4, 8);
    const leftArm = limb(armGeometry, jacket, 0.56);
    leftArm.position.set(-0.36, 0.66, 0);
    const rightArm = limb(armGeometry, jacket, 0.56);
    rightArm.position.set(0.36, 0.66, 0);
    for (const arm of [leftArm, rightArm]) {
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), skin);
      hand.position.y = -0.6;
      arm.add(hand);
    }
    body.add(leftArm, rightArm);

    const legGeometry = new THREE.CapsuleGeometry(0.1, 0.6, 4, 8);
    const leftLeg = limb(legGeometry, pants, 0.85);
    leftLeg.position.set(-0.14, 0.95, 0);
    const rightLeg = limb(legGeometry, pants, 0.85);
    rightLeg.position.set(0.14, 0.95, 0);
    for (const leg of [leftLeg, rightLeg]) {
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.13, 0.34), shoes);
      shoe.position.set(0, -0.9, -0.06);
      leg.add(shoe);
    }
    root.add(leftLeg, rightLeg);

    root.traverse((o) => {
      if (o instanceof THREE.Mesh) o.castShadow = true;
    });
    this.root = root;
    this.rig = { root, body, head, leftArm, rightArm, leftLeg, rightLeg };
  }

  createAnimator(): RunnerAnimator {
    return new ProceduralRunnerAnimator(this.rig);
  }
}
