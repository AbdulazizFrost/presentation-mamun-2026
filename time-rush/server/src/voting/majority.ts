import { ANSWER_IDS, emptyTally, type AnswerId, type VoteTally } from '@shared/types/game';

export type MajorityDecision =
  | { kind: 'none' }
  | { kind: 'winner'; answer: AnswerId }
  | { kind: 'tie'; leaders: AnswerId[] };

/** Decides a team's answer from its tally, optionally restricted to the answers allowed in a tie-break. */
export function decideMajority(tally: VoteTally, allowed: readonly AnswerId[] = ANSWER_IDS): MajorityDecision {
  let best = 0;
  let leaders: AnswerId[] = [];
  for (const answer of allowed) {
    const votes = tally[answer];
    if (votes > best) {
      best = votes;
      leaders = [answer];
    } else if (votes === best && votes > 0) {
      leaders.push(answer);
    }
  }
  if (best === 0) return { kind: 'none' };
  const [first] = leaders;
  if (leaders.length === 1 && first) return { kind: 'winner', answer: first };
  return { kind: 'tie', leaders };
}

export function pickRandom<T>(items: readonly T[], random: () => number): T {
  const index = Math.min(items.length - 1, Math.floor(random() * items.length));
  const item = items[index];
  if (item === undefined) throw new Error('pickRandom called with an empty list');
  return item;
}

export function restrictTally(tally: VoteTally, allowed: readonly AnswerId[]): VoteTally {
  const restricted = emptyTally();
  for (const answer of allowed) restricted[answer] = tally[answer];
  return restricted;
}
