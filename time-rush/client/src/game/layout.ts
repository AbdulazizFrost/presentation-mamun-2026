import type { AnswerId } from '@shared/types/game';

/**
 * World layout of one team's corridor (units ≈ metres, -Z is forward).
 * Door gates stand still along the corridor; the runner travels from gate to gate and the camera follows.
 */
export const LAYOUT = {
  corridorHalfWidth: 5,
  corridorHeight: 5.4,
  segmentLength: 4,
  segmentCount: 16,
  laneHalfWidth: 1.75,
  laneOffset: { A: -2.4, B: 0, C: 2.4 } as Record<AnswerId, number>,
  doorWidth: 1.8,
  doorHeight: 3.0,
  /** Distance between two door gates. */
  gateSpacing: 34,
  /** The runner waits this far in front of a gate while the team answers. */
  stopDistance: 6,
  /** Where the runner lands behind a gate (after passing or respawning). */
  afterDistance: 3.5,
  /** Camera offset from the runner, and the point it looks at (relative to the runner). */
  camera: { fov: 54, offset: [0, 4.2, 7.6] as const, lookAt: [0, 2.0, -22] as const },
} as const;

export function laneX(answer: AnswerId): number {
  return LAYOUT.laneOffset[answer];
}

export function gateZ(index: number): number {
  return -(index + 1) * LAYOUT.gateSpacing;
}

export function stopZ(index: number): number {
  return gateZ(index) + LAYOUT.stopDistance;
}

export function afterZ(index: number): number {
  return gateZ(index) - LAYOUT.afterDistance;
}

/** Where the run to door `index` starts. */
export function startZ(index: number): number {
  return index <= 0 ? 0 : afterZ(index - 1);
}
