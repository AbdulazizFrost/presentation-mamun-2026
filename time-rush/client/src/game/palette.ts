import * as THREE from 'three';
import type { TeamId } from '@shared/types/game';

/** Shared colours of the 3D world and the HUD (keep in sync with styles/global.css). */
export const PALETTE = {
  background: 0x070b16,
  floor: 0x23293a,
  floorLine: 0x3c4456,
  wallPanel: 0x6f788b,
  wallInset: 0x3a4253,
  pillar: 0x3a4152,
  ceiling: 0x1b2030,
  doorFrame: 0x8d96a8,
  doorPanel: 0x2b3140,
  white: 0xffffff,
  wrong: 0xff3b3b,
  correct: 0x39ff88,
  skin: 0xf1c7a3,
  pants: 0xe8ecf3,
  shoes: 0xf8fafc,
} as const;

export const TEAM_COLORS: Record<TeamId, number> = {
  A: 0x1f8bff,
  B: 0x22e05a,
};

export function teamColor(team: TeamId): THREE.Color {
  return new THREE.Color(TEAM_COLORS[team]);
}
