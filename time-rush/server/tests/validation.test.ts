import { describe, expect, it } from 'vitest';
import {
  normalizeRoomCode,
  parseHostResume,
  parseJoin,
  parseRemoveParticipant,
  parseVote,
  sanitizeNickname,
} from '@shared/protocol/validate';
import { decideMajority } from '../src/voting/majority';
import { TokenBucket } from '../src/socket/rateLimit';
import { FakeScheduler } from './helpers';

describe('20. invalid message payloads', () => {
  it.each([undefined, null, 42, 'text', [], {}, { code: 'ABCDE' }, { code: 'ABCDE', nickname: '' }, { code: 'abc', nickname: 'Ali' }])(
    'rejects join payload %j',
    (payload) => {
      expect(parseJoin(payload)).toBeNull();
    },
  );

  it('accepts a valid join payload and normalises the room code', () => {
    expect(parseJoin({ code: ' abcde ', nickname: '  Ali   Valiyev ' })).toEqual({ code: 'ABCDE', nickname: 'Ali Valiyev' });
  });

  it('rejects malformed session tokens', () => {
    expect(parseJoin({ code: 'ABCDE', nickname: 'Ali', sessionToken: 'x' })).toBeNull();
    expect(parseJoin({ code: 'ABCDE', nickname: 'Ali', sessionToken: { $ne: '' } })).toBeNull();
  });

  it('strips markup and limits nickname length', () => {
    expect(sanitizeNickname('<b>Ali</b>')).toBe('bAli/b');
    expect(sanitizeNickname('x'.repeat(21))).toBeNull();
    expect(sanitizeNickname('   ')).toBeNull();
  });

  it('validates teams, votes and participant ids', () => {
    expect(parseVote({ roundId: 'r1', answer: 'D' })).toBeNull();
    expect(parseVote({ roundId: 'r1; drop', answer: 'A' })).toBeNull();
    expect(parseVote({ roundId: 'r1', answer: 'A', correct: true })).toEqual({ roundId: 'r1', answer: 'A' });
    expect(parseRemoveParticipant({ participantId: 42 })).toBeNull();
    expect(parseHostResume({ code: 'ABCDE', hostToken: 'short' })).toBeNull();
    expect(normalizeRoomCode('ABCD0')).toBeNull(); // 0 is not in the alphabet
  });
});

describe('majority helper', () => {
  it('detects winners, ties and no votes', () => {
    expect(decideMajority({ A: 0, B: 0, C: 0 })).toEqual({ kind: 'none' });
    expect(decideMajority({ A: 3, B: 1, C: 0 })).toEqual({ kind: 'winner', answer: 'A' });
    expect(decideMajority({ A: 2, B: 2, C: 2 })).toEqual({ kind: 'tie', leaders: ['A', 'B', 'C'] });
    expect(decideMajority({ A: 5, B: 2, C: 2 }, ['B', 'C'])).toEqual({ kind: 'tie', leaders: ['B', 'C'] });
  });
});

describe('rate limiting', () => {
  it('allows a burst, blocks, then refills over time', () => {
    const clock = new FakeScheduler();
    const bucket = new TokenBucket({ capacity: 2, refillPerSecond: 1 }, clock);
    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(false);
    clock.advance(1000);
    expect(bucket.take()).toBe(true);
  });
});
