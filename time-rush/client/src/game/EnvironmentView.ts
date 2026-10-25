import * as THREE from 'three';
import type { TeamId } from '@shared/types/game';
import { LAYOUT } from './layout';
import { PALETTE, teamColor } from './palette';
import { floorTileTexture, laneGridTexture } from './textures';

/** Anything that draws the world around a runner. A GLB corridor can implement this later. */
export interface EnvironmentView {
  readonly root: THREE.Object3D;
  /** Keeps the endless corridor around the camera; `direction` is -1 looking forward, +1 looking back. */
  update(cameraZ: number, direction?: number): void;
}

/**
 * Sci-fi school corridor in the team colour, built from modular 4 m segments:
 * glowing lane with white rails, metal floor, panelled walls with light strips and ceiling arches.
 */
export class SciFiCorridor implements EnvironmentView {
  readonly root = new THREE.Group();
  private readonly segments: THREE.Group[] = [];
  /** Floor, lane and rails: moved in 8 m steps (a multiple of both texture tiles) so they look static. */
  private readonly ground = new THREE.Group();
  private readonly lights: THREE.PointLight[] = [];

  constructor(team: TeamId) {
    const color = teamColor(team);
    const { corridorHalfWidth: halfW, corridorHeight: height, segmentLength: segL, segmentCount, laneHalfWidth } = LAYOUT;
    const totalLength = segL * segmentCount;

    // ---------- floor, glowing lane and rails (they follow the camera in 8 m steps) ----------
    const floorTexture = floorTileTexture();
    floorTexture.repeat.set(halfW, totalLength / 2);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(halfW * 2, totalLength),
      new THREE.MeshStandardMaterial({ map: floorTexture, color: 0x6f7787, roughness: 0.85, metalness: 0.15 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = segL * 2 - totalLength / 2;

    const laneTexture = laneGridTexture();
    laneTexture.repeat.set(2, totalLength / 1.6);
    const lane = new THREE.Mesh(
      new THREE.PlaneGeometry(laneHalfWidth * 2, totalLength),
      new THREE.MeshStandardMaterial({
        color,
        map: laneTexture,
        emissive: color,
        emissiveMap: laneTexture,
        emissiveIntensity: 0.28,
        roughness: 0.75,
        metalness: 0.1,
      }),
    );
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(0, 0.012, floor.position.z);

    const railMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.45 });
    const railGeometry = new THREE.BoxGeometry(0.12, 0.07, totalLength);
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(railGeometry, railMaterial);
      rail.position.set(side * (laneHalfWidth + 0.08), 0.035, floor.position.z);
      this.ground.add(rail);
    }
    this.ground.add(floor, lane);
    this.root.add(this.ground);

    // ---------- repeating wall / ceiling segments ----------
    const panelMaterial = new THREE.MeshStandardMaterial({ color: PALETTE.wallPanel, roughness: 0.35, metalness: 0.6 });
    const insetMaterial = new THREE.MeshStandardMaterial({ color: PALETTE.wallInset, roughness: 0.5, metalness: 0.5 });
    const pillarMaterial = new THREE.MeshStandardMaterial({ color: PALETTE.pillar, roughness: 0.4, metalness: 0.7 });
    const ceilingMaterial = new THREE.MeshStandardMaterial({ color: PALETTE.ceiling, roughness: 0.6, metalness: 0.4 });
    const stripMaterial = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.0 });
    const lampMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe8f1ff, emissiveIntensity: 0.9 });

    const wallGeometry = new THREE.BoxGeometry(0.3, height, segL);
    const insetGeometry = new THREE.BoxGeometry(0.06, 1.5, segL - 1.0);
    const stripGeometry = new THREE.BoxGeometry(0.06, 0.12, segL - 0.7);
    const baseGeometry = new THREE.BoxGeometry(0.5, 0.35, segL);
    const pillarGeometry = new THREE.BoxGeometry(0.55, height, 0.5);
    const beamGeometry = new THREE.BoxGeometry(halfW * 2, 0.45, 0.5);
    const braceGeometry = new THREE.BoxGeometry(1.3, 0.35, 0.45);
    const ceilingGeometry = new THREE.BoxGeometry(halfW * 2, 0.2, segL);
    const lampGeometry = new THREE.BoxGeometry(1.5, 0.05, 0.55);
    const ceilingStripGeometry = new THREE.BoxGeometry(0.16, 0.04, segL - 0.6);

    for (let i = 0; i < segmentCount; i++) {
      const segment = new THREE.Group();
      for (const side of [-1, 1]) {
        const x = side * (halfW + 0.15);
        const wall = new THREE.Mesh(wallGeometry, panelMaterial);
        wall.position.set(x, height / 2, 0);
        const lowInset = new THREE.Mesh(insetGeometry, insetMaterial);
        lowInset.position.set(x - side * 0.17, 1.65, 0);
        const highInset = lowInset.clone();
        highInset.position.y = 3.65;
        const stripLow = new THREE.Mesh(stripGeometry, stripMaterial);
        stripLow.position.set(x - side * 0.19, 0.75, 0);
        const stripHigh = stripLow.clone();
        stripHigh.position.y = 2.65;
        const base = new THREE.Mesh(baseGeometry, pillarMaterial);
        base.position.set(side * (halfW - 0.1), 0.175, 0);
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.set(side * (halfW - 0.12), height / 2, -segL / 2);
        const brace = new THREE.Mesh(braceGeometry, pillarMaterial);
        brace.position.set(side * (halfW - 0.75), height - 0.55, -segL / 2);
        brace.rotation.z = side * -0.65;
        segment.add(wall, lowInset, highInset, stripLow, stripHigh, base, pillar, brace);
      }
      const beam = new THREE.Mesh(beamGeometry, pillarMaterial);
      beam.position.set(0, height - 0.2, -segL / 2);
      const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
      ceiling.position.set(0, height + 0.1, 0);
      const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
      lamp.position.set(0, height - 0.02, 0);
      const ceilingStrip = new THREE.Mesh(ceilingStripGeometry, stripMaterial);
      ceilingStrip.position.set(0, height - 0.01, 0);
      ceilingStrip.rotation.y = 0;
      segment.add(beam, ceiling, lamp);
      if (i % 2 === 0) segment.add(ceilingStrip);

      segment.position.z = segL * 2 - i * segL - segL / 2;
      this.segments.push(segment);
      this.root.add(segment);
    }

    // Soft coloured fill light along the corridor, so metal surfaces pick up the team colour.
    const fill = new THREE.PointLight(color, 14, 26, 1.8);
    fill.position.set(0, 3.5, -6);
    fill.userData.offsetZ = -13;
    const fillFar = new THREE.PointLight(color, 10, 26, 1.8);
    fillFar.position.set(0, 3.5, -20);
    fillFar.userData.offsetZ = -27;
    this.lights.push(fill, fillFar);
    this.root.add(fill, fillFar);
  }

  update(cameraZ: number, direction = -1): void {
    const { segmentLength: segL, segmentCount } = LAYOUT;
    const total = segL * segmentCount;
    // Keep the segments in the window the camera looks into; the others jump to the far end.
    const back = direction < 0 ? cameraZ + 6 : cameraZ + total - 6;
    for (const segment of this.segments) {
      while (segment.position.z > back) segment.position.z -= total;
      while (segment.position.z < back - total) segment.position.z += total;
    }
    this.ground.position.z = Math.round(cameraZ / 8) * 8 + (direction < 0 ? 0 : 48);
    // offsetZ is negative (ahead of the camera); looking back, mirror it.
    for (const light of this.lights) light.position.z = cameraZ - direction * light.userData.offsetZ;
  }
}
