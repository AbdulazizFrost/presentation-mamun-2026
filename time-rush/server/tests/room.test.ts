import { describe, expect, it } from 'vitest';
import { winnerOf } from '@shared/types/game';
import { addPlayer, byTeam, setup } from './helpers';

const HOST = 'host-socket';

/** Joins `count` players, starts, and runs both teams to their first doors (VOTING). */
function raceToFirstDoor(ctx: ReturnType<typeof setup>, count: number) {
  const ids = Array.from({ length: count }, (_, i) => addPlayer(ctx.room, `p${i}`).participantId);
  expect(ctx.room.start(HOST).ok).toBe(true);
  ctx.scheduler.advance(ctx.config.countdownMs + ctx.config.runMs);
  const snap = ctx.room.snapshot();
  expect(snap.phase).toBe('PLAYING');
  expect(snap.teams.A.phase).toBe('VOTING');
  expect(snap.teams.B.phase).toBe('VOTING');
  return { ids, teams: byTeam(ctx.room, ids), roundA: snap.teams.A.roundId!, roundB: snap.teams.B.roundId! };
}

describe('rooms and participants', () => {
  it('1. creates a room in the lobby with a host token', () => {
    const { room, hostToken, manager } = setup();
    expect(manager.get('ABCDE')).toBe(room);
    expect(hostToken.length).toBeGreaterThan(16);
    const snap = room.snapshot();
    expect(snap).toMatchObject({ phase: 'LOBBY', hostConnected: true, totalRounds: 3 });
    expect(snap.participants).toHaveLength(0);
  });

  it('2. lets a participant join the lobby without a team', () => {
    const { room } = setup();
    const result = room.join('Ali', 'socket-1');
    expect(result.ok && result.data).toMatchObject({ nickname: 'Ali', team: null });
  });

  it('3. returns nothing for an unknown room code', () => {
    expect(setup().manager.get('ZZZZZ')).toBeUndefined();
  });

  it('4. assigns random, balanced teams when the game starts', () => {
    const ctx = setup({}, Math.random);
    const ids = Array.from({ length: 7 }, (_, i) => addPlayer(ctx.room, `p${i}`).participantId);
    ctx.room.start(HOST);
    const teams = byTeam(ctx.room, ids);
    expect(teams.A.length + teams.B.length).toBe(7);
    expect(Math.abs(teams.A.length - teams.B.length)).toBe(1);
  });

  it('5. rejects new players after the start but lets known players reconnect', () => {
    const ctx = setup();
    const p = addPlayer(ctx.room, 'Ali');
    ctx.room.start(HOST);
    expect(ctx.room.join('Late', 'socket-late')).toMatchObject({ ok: false, error: 'GAME_IN_PROGRESS' });
    const back = ctx.room.join('Ali', 'socket-ali-2', p.sessionToken);
    expect(back.ok && back.data.participantId).toBe(p.participantId);
  });

  it('5b. clears teams on restart and draws them again at the next start', () => {
    const ctx = setup();
    const ids = ['a', 'b'].map((n) => addPlayer(ctx.room, n).participantId);
    ctx.room.start(HOST);
    expect(ids.every((id) => ctx.room.teamOf(id) !== null)).toBe(true);
    ctx.room.restart(HOST);
    expect(ids.every((id) => ctx.room.teamOf(id) === null)).toBe(true);
    expect(ctx.room.join('Newcomer', 'socket-new').ok).toBe(true);
  });
});

describe('race flow', () => {
  it('counts down, runs to the first door, then shows each team its own question', () => {
    const ctx = setup();
    ['a', 'b'].forEach((n) => addPlayer(ctx.room, n));
    ctx.room.start(HOST);
    expect(ctx.room.snapshot().phase).toBe('COUNTDOWN');
    ctx.scheduler.advance(ctx.config.countdownMs);
    let snap = ctx.room.snapshot();
    expect(snap.teams.A).toMatchObject({ phase: 'RUNNING', roundIndex: 0, question: null });
    ctx.scheduler.advance(ctx.config.runMs);
    snap = ctx.room.snapshot();
    expect(snap.teams.A.question?.id).toBe('q1');
    expect(snap.teams.B.question?.id).toBe('q4');
    expect(snap.teams.A.question).not.toHaveProperty('correctAnswer');
    expect(snap.teams.A.phaseDurationMs).toBe(ctx.config.votingMs);
  });

  it('closes voting early when every connected team member has voted — the other team keeps waiting', () => {
    const ctx = setup();
    const { teams, roundA } = raceToFirstDoor(ctx, 4);
    ctx.room.submitVote(teams.A[0]!, roundA, 'A');
    expect(ctx.room.teamPhase('A')).toBe('VOTING');
    ctx.room.submitVote(teams.A[1]!, roundA, 'A');
    expect(ctx.room.teamPhase('A')).toBe('ANIMATING');
    expect(ctx.room.teamPhase('B')).toBe('VOTING');
    // Team A runs on to its second door while Team B is still thinking.
    ctx.scheduler.advance(ctx.config.passMs + ctx.config.runMs);
    const snap = ctx.room.snapshot();
    expect(snap.teams.A).toMatchObject({ phase: 'VOTING', roundIndex: 1 });
    expect(snap.teams.B).toMatchObject({ phase: 'VOTING', roundIndex: 0 });
  });

  it('closes voting after 30 seconds when not everyone votes', () => {
    const ctx = setup();
    const { teams, roundA } = raceToFirstDoor(ctx, 4);
    ctx.room.submitVote(teams.A[0]!, roundA, 'B');
    ctx.scheduler.advance(ctx.config.votingMs - 1);
    expect(ctx.room.teamPhase('A')).toBe('VOTING');
    ctx.scheduler.advance(1);
    expect(ctx.room.teamPhase('A')).toBe('ANIMATING');
    expect(ctx.recorded.resolved.find((r) => r.team === 'A')).toMatchObject({ selectedAnswer: 'B', outcome: 'wrong' });
  });

  it('a wrong door takes longer (crash and respawn) than a right one (pass through)', () => {
    const ctx = setup();
    const { teams, roundA, roundB } = raceToFirstDoor(ctx, 2);
    ctx.room.submitVote(teams.A[0]!, roundA, 'A'); // q1 correct
    ctx.room.submitVote(teams.B[0]!, roundB, 'C'); // q4 wrong
    ctx.scheduler.advance(ctx.config.passMs);
    expect(ctx.room.teamPhase('A')).toBe('RUNNING');
    expect(ctx.room.teamPhase('B')).toBe('ANIMATING');
    ctx.scheduler.advance(ctx.config.crashMs - ctx.config.passMs);
    expect(ctx.room.teamPhase('B')).toBe('RUNNING');
  });

  it('skips a door at once when a team has no connected players', () => {
    const ctx = setup();
    const { teams } = raceToFirstDoor(ctx, 2);
    // addPlayer connects each player as socket-<nickname>.
    const bName = ctx.room.snapshot().participants.find((p) => p.id === teams.B[0])!.nickname;
    ctx.room.participantDisconnected(teams.B[0]!, `socket-${bName}`);
    expect(ctx.recorded.resolved.find((r) => r.team === 'B')).toMatchObject({ outcome: 'skipped', decidedBy: 'noVotes' });
  });
});

describe('voting', () => {
  it('6 + 7. keeps one vote per participant and lets them change it', () => {
    const ctx = setup();
    const { teams, roundA } = raceToFirstDoor(ctx, 4);
    const a = teams.A[0]!;
    ctx.room.submitVote(a, roundA, 'A');
    ctx.room.submitVote(a, roundA, 'A');
    expect(ctx.room.snapshot().teams.A.tally).toEqual({ A: 1, B: 0, C: 0 });
    ctx.room.submitVote(a, roundA, 'C');
    expect(ctx.room.snapshot().teams.A).toMatchObject({ tally: { A: 0, B: 0, C: 1 }, votedCount: 1 });
  });

  it('8. rejects votes for an old door and after voting closes', () => {
    const ctx = setup();
    const { teams, roundA } = raceToFirstDoor(ctx, 2);
    const a = teams.A[0]!;
    ctx.room.submitVote(a, roundA, 'A'); // only member → closes at once
    expect(ctx.room.submitVote(a, roundA, 'B')).toMatchObject({ ok: false, error: 'VOTING_CLOSED' });
    ctx.scheduler.advance(ctx.config.passMs + ctx.config.runMs);
    expect(ctx.room.submitVote(a, roundA, 'B')).toMatchObject({ ok: false, error: 'STALE_ROUND' });
    expect(ctx.recorded.resolved[0]?.selectedAnswer).toBe('A');
  });

  it('9. counts both teams independently', () => {
    const ctx = setup();
    const { teams, roundA, roundB } = raceToFirstDoor(ctx, 4);
    ctx.room.submitVote(teams.A[0]!, roundA, 'B');
    ctx.room.submitVote(teams.B[0]!, roundB, 'C');
    const snap = ctx.room.snapshot();
    expect(snap.teams.A.tally).toEqual({ A: 0, B: 1, C: 0 });
    expect(snap.teams.B.tally).toEqual({ A: 0, B: 0, C: 1 });
    // A vote with the other team's round id is rejected.
    expect(ctx.room.submitVote(teams.A[1]!, roundB, 'A')).toMatchObject({ ok: false, error: 'STALE_ROUND' });
  });

  it('10. picks the majority and checks it against the team’s own question', () => {
    const ctx = setup();
    const { teams, roundA, roundB } = raceToFirstDoor(ctx, 6);
    ctx.room.submitVote(teams.A[0]!, roundA, 'A');
    ctx.room.submitVote(teams.A[1]!, roundA, 'A');
    ctx.room.submitVote(teams.A[2]!, roundA, 'C');
    ctx.room.submitVote(teams.B[0]!, roundB, 'B');
    ctx.room.submitVote(teams.B[1]!, roundB, 'B');
    ctx.room.submitVote(teams.B[2]!, roundB, 'A');
    const a = ctx.recorded.resolved.find((r) => r.team === 'A');
    const b = ctx.recorded.resolved.find((r) => r.team === 'B');
    expect(a).toMatchObject({ questionId: 'q1', selectedAnswer: 'A', decidedBy: 'majority', outcome: 'correct' });
    expect(b).toMatchObject({ questionId: 'q4', selectedAnswer: 'B', outcome: 'wrong', correctAnswer: 'A' });
  });

  it('11. runs a tie-break limited to the tied answers, closing early when everyone re-votes', () => {
    const ctx = setup();
    const { teams, roundA } = raceToFirstDoor(ctx, 6);
    const [a1, a2, a3] = teams.A as [string, string, string];
    ctx.room.submitVote(a1, roundA, 'A');
    ctx.room.submitVote(a2, roundA, 'B');
    ctx.scheduler.advance(ctx.config.votingMs);
    const snap = ctx.room.snapshot();
    expect(snap.teams.A).toMatchObject({ phase: 'TIE_BREAK', tieBreak: ['A', 'B'], roundId: roundA });
    expect(ctx.room.submitVote(a3, roundA, 'C')).toMatchObject({ ok: false, error: 'INVALID_ANSWER' });
    ctx.room.submitVote(a3, roundA, 'B');
    expect(ctx.room.teamPhase('A')).toBe('ANIMATING');
    expect(ctx.recorded.resolved.find((r) => r.team === 'A')).toMatchObject({ selectedAnswer: 'B', decidedBy: 'tieBreak' });
  });

  it('11b. picks randomly among the leaders when the tie-break stays tied', () => {
    const ctx = setup({}, () => 0.99);
    const { teams, roundA } = raceToFirstDoor(ctx, 6);
    ctx.room.submitVote(teams.A[0]!, roundA, 'A');
    ctx.room.submitVote(teams.A[1]!, roundA, 'C');
    ctx.scheduler.advance(ctx.config.votingMs + ctx.config.tieBreakMs);
    const results = ctx.recorded.resolved.filter((r) => r.team === 'A');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ selectedAnswer: 'C', decidedBy: 'random' });
  });

  it('12. skips the door without points when nobody votes in 30 seconds', () => {
    const ctx = setup();
    raceToFirstDoor(ctx, 2);
    ctx.scheduler.advance(ctx.config.votingMs);
    const a = ctx.recorded.resolved.find((r) => r.team === 'A');
    expect(a).toMatchObject({ selectedAnswer: null, outcome: 'skipped', pointsAwarded: 0 });
  });
});

describe('scoring and the end of the race', () => {
  it('13 + 14 + 15. scores right answers once and wrong answers with zero', () => {
    const ctx = setup();
    const { teams, roundA, roundB } = raceToFirstDoor(ctx, 2);
    ctx.room.submitVote(teams.A[0]!, roundA, 'A');
    ctx.room.submitVote(teams.B[0]!, roundB, 'C');
    ctx.room.pause(HOST);
    ctx.room.resume(HOST);
    ctx.scheduler.advance(10);
    const snap = ctx.room.snapshot();
    expect(snap.teams.A).toMatchObject({ score: ctx.config.pointsCorrect, correctCount: 1, completedRounds: 1 });
    expect(snap.teams.B).toMatchObject({ score: 0, correctCount: 0, completedRounds: 1 });
    expect(ctx.recorded.resolved).toHaveLength(2);
  });

  it('16 + 17. finishes each team after its last door and ends the game when both are done', () => {
    const ctx = setup();
    const { teams } = raceToFirstDoor(ctx, 2);
    const a = teams.A[0]!;
    const b = teams.B[0]!;
    // Team A answers everything right and fast; Team B always waits for the deadline.
    for (let i = 0; i < 3; i++) {
      const snap = ctx.room.snapshot();
      ctx.room.submitVote(a, snap.teams.A.roundId!, (['A', 'B', 'C'] as const)[i]!);
      ctx.scheduler.advance(ctx.config.passMs + ctx.config.runMs);
    }
    expect(ctx.room.snapshot().teams.A).toMatchObject({ phase: 'FINISHED', finishRank: 1, score: 300 });
    expect(ctx.room.snapshot().phase).toBe('PLAYING');
    for (let guard = 0; guard < 20 && ctx.room.teamPhase('B') !== 'FINISHED'; guard++) {
      const snap = ctx.room.snapshot();
      if (snap.teams.B.phase === 'VOTING') ctx.room.submitVote(b, snap.teams.B.roundId!, 'C');
      ctx.scheduler.advance(ctx.config.crashMs + ctx.config.runMs);
    }
    const end = ctx.room.snapshot();
    expect(end.phase).toBe('GAME_OVER');
    expect(end.teams.B.finishRank).toBe(2);
    expect(ctx.recorded.finished).toBe(1);
    expect(winnerOf(end)).toBe('A');
    const asked = end.history.map((r) => r.questionId);
    expect(new Set(asked).size).toBe(6);

    expect(ctx.room.restart(HOST).ok).toBe(true);
    expect(ctx.room.snapshot()).toMatchObject({ phase: 'LOBBY' });
  });

  it('lets only the host choose the language of the room', () => {
    const ctx = setup();
    expect(ctx.room.snapshot().language).toBe('en');
    expect(ctx.room.setLanguage('not-the-host', 'uz').ok).toBe(false);
    expect(ctx.room.setLanguage(HOST, 'uz').ok).toBe(true);
    expect(ctx.room.snapshot().language).toBe('uz');
  });

  it('lets both teams win with the same number of correct answers, and nobody with none', () => {
    const snap = (a: number, b: number) =>
      ({ teams: { A: { correctCount: a, finishRank: 2 }, B: { correctCount: b, finishRank: 1 } } }) as unknown as Parameters<typeof winnerOf>[0];
    expect(winnerOf(snap(3, 3))).toBe('both');
    expect(winnerOf(snap(0, 0))).toBe('none');
    expect(winnerOf(snap(2, 5))).toBe('B');
  });

  it('pauses and resumes both teams’ timers with the remaining time', () => {
    const ctx = setup();
    raceToFirstDoor(ctx, 4);
    ctx.scheduler.advance(4000);
    expect(ctx.room.pause(HOST).ok).toBe(true);
    expect(ctx.room.snapshot().teams.A.pausedRemainingMs).toBe(ctx.config.votingMs - 4000);
    ctx.scheduler.advance(60000);
    expect(ctx.room.teamPhase('A')).toBe('VOTING');
    ctx.room.resume(HOST);
    ctx.scheduler.advance(ctx.config.votingMs - 4000);
    expect(ctx.room.teamPhase('A')).toBe('ANIMATING');
  });
});

describe('reliability and security', () => {
  it('18. restores a reconnecting participant with team and vote, without duplicates', () => {
    const ctx = setup();
    const p = addPlayer(ctx.room, 'Ali');
    addPlayer(ctx.room, 'Bek');
    addPlayer(ctx.room, 'Cem');
    ctx.room.start(HOST);
    ctx.scheduler.advance(ctx.config.countdownMs + ctx.config.runMs);
    const team = ctx.room.teamOf(p.participantId)!;
    const roundId = ctx.room.snapshot().teams[team].roundId!;
    // With the deterministic test random, Ali shares Team A with Bek, so voting stays open after his vote.
    ctx.room.submitVote(p.participantId, roundId, 'B');
    expect(ctx.room.teamPhase(team)).toBe('VOTING');
    ctx.room.participantDisconnected(p.participantId, 'socket-Ali');
    const back = ctx.room.join('Ali', 'socket-new', p.sessionToken);
    expect(back.ok && back.data).toMatchObject({ participantId: p.participantId, team, reconnected: true, currentVote: { roundId, answer: 'B' } });
    expect(ctx.room.snapshot().participants).toHaveLength(3);
  });

  it('18b. removes a participant who does not return within the grace period', () => {
    const ctx = setup();
    const p = addPlayer(ctx.room, 'Ali');
    ctx.room.participantDisconnected(p.participantId, 'socket-Ali');
    ctx.scheduler.advance(ctx.config.reconnectGraceMs);
    expect(ctx.room.snapshot().participants).toHaveLength(0);
  });

  it('18c. pauses when the host disconnects and lets the host resume with the token', () => {
    const ctx = setup();
    raceToFirstDoor(ctx, 2);
    ctx.room.hostDisconnected(HOST);
    expect(ctx.room.snapshot()).toMatchObject({ paused: true, pauseReason: 'hostDisconnected', hostConnected: false });
    expect(ctx.room.resumeHost('wrong-token-aaaaaaaaaaaa', 'host-2')).toMatchObject({ ok: false, error: 'NOT_HOST' });
    expect(ctx.room.resumeHost(ctx.hostToken, 'host-2').ok).toBe(true);
    expect(ctx.room.resume('host-2').ok).toBe(true);
  });

  it('19. rejects host actions from non-host sockets', () => {
    const ctx = setup();
    const p = addPlayer(ctx.room, 'Ali');
    for (const result of [
      ctx.room.start('socket-Ali'),
      ctx.room.pause('socket-Ali'),
      ctx.room.resume('socket-Ali'),
      ctx.room.restart('socket-Ali'),
      ctx.room.removeParticipant('socket-Ali', p.participantId),
    ]) {
      expect(result).toMatchObject({ ok: false, error: 'NOT_HOST' });
    }
    expect(ctx.room.snapshot().phase).toBe('LOBBY');
  });

  it('lets the host remove a participant and drops their vote', () => {
    const ctx = setup();
    const { teams, roundA } = raceToFirstDoor(ctx, 4);
    const a = teams.A[0]!;
    ctx.room.submitVote(a, roundA, 'A');
    expect(ctx.room.removeParticipant(HOST, a).ok).toBe(true);
    expect(ctx.recorded.removed).toEqual([a]);
    expect(ctx.room.snapshot().teams.A.tally).toEqual({ A: 0, B: 0, C: 0 });
    expect(ctx.room.submitVote(a, roundA, 'A')).toMatchObject({ ok: false, error: 'NOT_IN_ROOM' });
  });

  it('rejects votes from participants without a team', () => {
    const ctx = setup();
    const p = addPlayer(ctx.room, 'Lobby');
    expect(ctx.room.submitVote(p.participantId, 'r1', 'A')).toMatchObject({ ok: false, error: 'NO_TEAM' });
  });
});
