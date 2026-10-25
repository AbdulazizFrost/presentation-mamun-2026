// Core game types shared by the server, the projector (host) client and the phone client.

export type TeamId = 'A' | 'B';
export const TEAM_IDS: readonly TeamId[] = ['A', 'B'];

export type AnswerId = 'A' | 'B' | 'C';
export const ANSWER_IDS: readonly AnswerId[] = ['A', 'B', 'C'];

/** Whole-game phase. During PLAYING each team runs its own race (see TeamPhase). */
export type GamePhase = 'LOBBY' | 'COUNTDOWN' | 'PLAYING' | 'GAME_OVER';

/**
 * Phase of one team's race. Teams are independent: a team that answers sooner runs on sooner.
 * RUNNING → (at the doors) VOTING → [TIE_BREAK] → ANIMATING (through the door / crash and respawn) → RUNNING …
 */
export type TeamPhase = 'WAITING' | 'RUNNING' | 'VOTING' | 'TIE_BREAK' | 'ANIMATING' | 'FINISHED';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Answer {
  id: AnswerId;
  text: string;
}

export interface Question {
  id: string;
  topic: string;
  question: string;
  answers: readonly [Answer, Answer, Answer];
  correctAnswer: AnswerId;
  explanation: string;
  difficulty?: Difficulty;
}

/** What clients may see while a question is open: no correct answer, no explanation. */
export type PublicQuestion = Omit<Question, 'correctAnswer' | 'explanation'>;

export type VoteTally = Record<AnswerId, number>;

export type TeamOutcome = 'correct' | 'wrong' | 'skipped';

export type DecisionMethod = 'majority' | 'tieBreak' | 'random' | 'noVotes';

export interface TeamRoundResult {
  team: TeamId;
  roundId: string;
  /** 0-based door index. */
  roundIndex: number;
  questionId: string;
  question: string;
  correctAnswer: AnswerId;
  correctAnswerText: string;
  explanation: string;
  selectedAnswer: AnswerId | null;
  outcome: TeamOutcome;
  pointsAwarded: number;
  tally: VoteTally;
  decidedBy: DecisionMethod;
}

export interface ParticipantPublic {
  id: string;
  nickname: string;
  team: TeamId | null;
  connected: boolean;
}

export interface TeamSnapshot {
  score: number;
  correctCount: number;
  completedRounds: number;
  memberCount: number;
  connectedCount: number;
  phase: TeamPhase;
  /** Door the team is running to / standing at (0-based), -1 before the start. */
  roundIndex: number;
  roundId: string | null;
  /** Visible while the team is at the doors (VOTING / TIE_BREAK / ANIMATING). */
  question: PublicQuestion | null;
  /** During a tie-break: the answers the team may still vote for. */
  tieBreak: AnswerId[] | null;
  /** Server timestamp (ms) when the team's current phase ends; null when untimed or paused. */
  phaseEndsAt: number | null;
  /** Full length of the current phase, so clients can compute progress. */
  phaseDurationMs: number | null;
  pausedRemainingMs: number | null;
  tally: VoteTally;
  /** Connected members who have voted in the current question. */
  votedCount: number;
  lastResult: TeamRoundResult | null;
  finishedAt: number | null;
  /** 1 for the team that finished first. */
  finishRank: number | null;
}

export type PauseReason = 'host' | 'hostDisconnected';

/** Language of the whole game; the host picks it, every phone follows. */
export type Language = 'en' | 'uz';
export const LANGUAGES: readonly Language[] = ['en', 'uz'];

export interface RoomSnapshot {
  code: string;
  language: Language;
  phase: GamePhase;
  paused: boolean;
  pauseReason: PauseReason | null;
  hostConnected: boolean;
  totalRounds: number;
  /** End of the start countdown (COUNTDOWN only). */
  phaseEndsAt: number | null;
  pausedRemainingMs: number | null;
  teams: Record<TeamId, TeamSnapshot>;
  participants: ParticipantPublic[];
  history: TeamRoundResult[];
  /** Server clock at the moment the snapshot was built, for countdown synchronisation. */
  serverNow: number;
}

export function emptyTally(): VoteTally {
  return { A: 0, B: 0, C: 0 };
}

export function otherTeam(team: TeamId): TeamId {
  return team === 'A' ? 'B' : 'A';
}

/** Who won: a team, both teams (same number of correct answers) or nobody (no correct answers at all). */
export type GameWinner = TeamId | 'both' | 'none';

/** The team with more correct answers wins; the same number means both win, unless nobody answered correctly. */
export function winnerOf(snapshot: Pick<RoomSnapshot, 'teams'>): GameWinner {
  const { A, B } = snapshot.teams;
  if (A.correctCount !== B.correctCount) return A.correctCount > B.correctCount ? 'A' : 'B';
  return A.correctCount > 0 ? 'both' : 'none';
}

export function teamWon(winner: GameWinner, team: TeamId): boolean {
  return winner === team || winner === 'both';
}
