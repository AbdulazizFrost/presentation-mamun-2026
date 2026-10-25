// Central game configuration: timing, scoring and limits.
// The projector reproduces each team's race from these timings, so they are shared.

export interface GameConfig {
  /** Doors (questions) per team; each team gets its own questions, so the bank needs 2× this many. */
  roundsPerGame: number;
  shuffleQuestions: boolean;
  /** "3, 2, 1, GO" before both runners start. */
  countdownMs: number;
  /** Running from one door (or the start) to the next door. */
  runMs: number;
  /** Time to answer at the doors; closes early once every connected team member has voted. */
  votingMs: number;
  tieBreakMs: number;
  /** Result animation when the team chose the right door (open it and run through). */
  passMs: number;
  /** Result animation for a wrong door or no votes (crash, fall, respawn behind the door). */
  crashMs: number;
  pointsCorrect: number;
  pointsWrong: number;
  pointsSkipped: number;
  reconnectGraceMs: number;
  hostReconnectGraceMs: number;
  maxParticipantsPerRoom: number;
  maxNicknameLength: number;
}

export const GAME_CONFIG: GameConfig = {
  roundsPerGame: 20,
  shuffleQuestions: true,
  countdownMs: 4000,
  runMs: 3500,
  votingMs: 30000,
  tieBreakMs: 5000,
  passMs: 2400,
  crashMs: 3400,
  pointsCorrect: 100,
  pointsWrong: 0,
  pointsSkipped: 0,
  reconnectGraceMs: 2 * 60 * 1000,
  hostReconnectGraceMs: 30 * 60 * 1000,
  maxParticipantsPerRoom: 200,
  maxNicknameLength: 20,
};

/** Token-bucket limits per socket (capacity = burst, refillPerSecond = sustained rate). */
export const RATE_LIMITS = {
  vote: { capacity: 8, refillPerSecond: 4 },
  roomCreate: { capacity: 3, refillPerSecond: 1 / 20 },
  general: { capacity: 30, refillPerSecond: 10 },
} as const;
