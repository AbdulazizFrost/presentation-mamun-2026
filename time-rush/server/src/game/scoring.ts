import type { GameConfig } from '@shared/config';
import type { AnswerId, TeamOutcome } from '@shared/types/game';

export function evaluateOutcome(selected: AnswerId | null, correct: AnswerId): TeamOutcome {
  if (selected === null) return 'skipped';
  return selected === correct ? 'correct' : 'wrong';
}

export function pointsFor(outcome: TeamOutcome, config: GameConfig): number {
  switch (outcome) {
    case 'correct':
      return config.pointsCorrect;
    case 'wrong':
      return config.pointsWrong;
    case 'skipped':
      return config.pointsSkipped;
  }
}
