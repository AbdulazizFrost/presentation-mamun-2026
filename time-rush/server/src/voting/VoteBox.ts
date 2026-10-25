import { emptyTally, type AnswerId, type TeamId, type VoteTally } from '@shared/types/game';

/**
 * Authoritative votes of one round: one active vote per participant.
 * A newer vote from the same participant replaces the older one.
 * Tallies are always recomputed from these records, never taken from clients.
 */
export class VoteBox {
  private readonly votes = new Map<string, { team: TeamId; answer: AnswerId }>();

  cast(participantId: string, team: TeamId, answer: AnswerId): void {
    this.votes.set(participantId, { team, answer });
  }

  remove(participantId: string): void {
    this.votes.delete(participantId);
  }

  get(participantId: string): AnswerId | null {
    return this.votes.get(participantId)?.answer ?? null;
  }

  tally(team: TeamId): VoteTally {
    const tally = emptyTally();
    for (const vote of this.votes.values()) {
      if (vote.team === team) tally[vote.answer] += 1;
    }
    return tally;
  }

  clear(): void {
    this.votes.clear();
  }
}
