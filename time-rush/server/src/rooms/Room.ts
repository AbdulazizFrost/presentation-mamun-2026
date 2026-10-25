import { timingSafeEqual } from 'node:crypto';
import type { GameConfig } from '@shared/config';
import type { ErrorCode, Result, RoundStarted, TieBreakStarted, VoteUpdate } from '@shared/protocol/events';
import { toPublicQuestion } from '@shared/questions/toPublic';
import {
  TEAM_IDS,
  type AnswerId,
  type DecisionMethod,
  type GamePhase,
  type ParticipantPublic,
  type PauseReason,
  type Question,
  type RoomSnapshot,
  type TeamId,
  type TeamPhase,
  type TeamRoundResult,
  type TeamSnapshot,
  type Language,
} from '@shared/types/game';
import type { Scheduler, TimerHandle } from '../game/scheduler';
import { evaluateOutcome, pointsFor } from '../game/scoring';
import { TimerSlot } from '../game/TimerSlot';
import { decideMajority, pickRandom } from '../voting/majority';
import { VoteBox } from '../voting/VoteBox';

/** Outgoing notifications; the socket layer turns them into Socket.IO broadcasts. */
export interface RoomEvents {
  state(snapshot: RoomSnapshot): void;
  votes(update: VoteUpdate): void;
  roundStarted(payload: RoundStarted): void;
  tieBreak(payload: TieBreakStarted): void;
  resolved(result: TeamRoundResult): void;
  paused(): void;
  resumed(): void;
  finished(): void;
  participantRemoved(participantId: string, socketId: string | null): void;
  /** The host stayed away longer than the grace period; the room should be deleted. */
  expired(): void;
}

export interface RoomDeps {
  code: string;
  hostToken: string;
  scheduler: Scheduler;
  config: GameConfig;
  questions: readonly Question[];
  random: () => number;
  createId: (prefix: string) => string;
  createToken: () => string;
  events: RoomEvents;
}

interface Participant {
  id: string;
  nickname: string;
  team: TeamId | null;
  sessionToken: string;
  socketId: string | null;
  connected: boolean;
  graceTimer: TimerHandle | null;
}

/** One team's race: which door it is at, its votes and its own timer. */
interface TeamRun {
  phase: TeamPhase;
  roundIndex: number;
  roundId: string | null;
  questions: Question[];
  votes: VoteBox;
  tieBreak: AnswerId[] | null;
  resolved: boolean;
  timer: TimerSlot;
  score: number;
  correctCount: number;
  completedRounds: number;
  lastResult: TeamRoundResult | null;
  finishedAt: number | null;
  finishRank: number | null;
}

export interface JoinedParticipant {
  participantId: string;
  sessionToken: string;
  nickname: string;
  team: TeamId | null;
  currentVote: { roundId: string; answer: AnswerId } | null;
  reconnected: boolean;
}

const ok = <T>(data: T): Result<T> => ({ ok: true, data });
const fail = <T>(error: ErrorCode, message: string): Result<T> => ({ ok: false, error, message });

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * One classroom game. Owns participants, the random team draw, both teams' independent races,
 * votes and scores. All timing goes through the injected Scheduler.
 */
export class Room {
  readonly code: string;
  private readonly hostToken: string;
  private readonly deps: RoomDeps;

  private hostSocketId: string | null = null;
  private hostExpiryTimer: TimerHandle | null = null;
  private readonly participants = new Map<string, Participant>();

  private phase: GamePhase = 'LOBBY';
  private paused = false;
  private language: Language = 'en';
  private pauseReason: PauseReason | null = null;
  private readonly countdown: TimerSlot;
  private readonly teams: Record<TeamId, TeamRun>;
  private history: TeamRoundResult[] = [];

  constructor(deps: RoomDeps) {
    this.deps = deps;
    this.code = deps.code;
    this.hostToken = deps.hostToken;
    this.countdown = new TimerSlot(deps.scheduler);
    this.teams = { A: this.freshTeam(), B: this.freshTeam() };
  }

  // ------------------------------------------------------------------ host

  attachHost(socketId: string): void {
    this.hostSocketId = socketId;
    this.cancelHostExpiry();
  }

  isHost(socketId: string): boolean {
    return this.hostSocketId !== null && this.hostSocketId === socketId;
  }

  resumeHost(hostToken: string, socketId: string): Result<null> {
    if (!safeEqual(hostToken, this.hostToken)) return fail('NOT_HOST', 'Invalid host session.');
    this.attachHost(socketId);
    this.broadcastState();
    return ok(null);
  }

  hostDisconnected(socketId: string): void {
    if (!this.isHost(socketId)) return;
    this.hostSocketId = null;
    if (this.isGameRunning() && !this.paused) this.pauseInternal('hostDisconnected');
    this.cancelHostExpiry();
    this.hostExpiryTimer = this.deps.scheduler.setTimeout(() => {
      this.hostExpiryTimer = null;
      if (this.hostSocketId === null) this.deps.events.expired();
    }, this.deps.config.hostReconnectGraceMs);
    this.broadcastState();
  }

  start(socketId: string): Result<null> {
    if (!this.isHost(socketId)) return fail('NOT_HOST', 'Only the host can start the game.');
    if (this.phase !== 'LOBBY') return fail('INVALID_STATE', 'The game has already started.');
    const questions = this.pickQuestions();
    if (!questions) return fail('INVALID_STATE', 'Not enough questions for a game.');
    this.teams.A = { ...this.freshTeam(), questions: questions.A };
    this.teams.B = { ...this.freshTeam(), questions: questions.B };
    this.history = [];
    this.assignTeams();
    this.phase = 'COUNTDOWN';
    this.countdown.schedule(this.deps.config.countdownMs, () => this.beginRace());
    this.broadcastState();
    return ok(null);
  }

  setLanguage(socketId: string, language: Language): Result<null> {
    if (!this.isHost(socketId)) return fail('NOT_HOST', 'Only the host can change the language.');
    if (this.language !== language) {
      this.language = language;
      this.broadcastState();
    }
    return ok(null);
  }

  pause(socketId: string): Result<null> {
    if (!this.isHost(socketId)) return fail('NOT_HOST', 'Only the host can pause the game.');
    if (this.paused) return ok(null);
    if (!this.isGameRunning()) return fail('INVALID_STATE', 'Nothing to pause right now.');
    this.pauseInternal('host');
    return ok(null);
  }

  resume(socketId: string): Result<null> {
    if (!this.isHost(socketId)) return fail('NOT_HOST', 'Only the host can resume the game.');
    if (!this.paused) return fail('INVALID_STATE', 'The game is not paused.');
    this.paused = false;
    this.pauseReason = null;
    this.countdown.resume();
    for (const team of TEAM_IDS) this.teams[team].timer.resume();
    this.deps.events.resumed();
    this.broadcastState();
    for (const team of TEAM_IDS) this.checkEveryoneVoted(team);
    return ok(null);
  }

  restart(socketId: string): Result<null> {
    if (!this.isHost(socketId)) return fail('NOT_HOST', 'Only the host can restart the game.');
    this.countdown.clear();
    for (const team of TEAM_IDS) this.teams[team].timer.clear();
    this.teams.A = this.freshTeam();
    this.teams.B = this.freshTeam();
    this.paused = false;
    this.pauseReason = null;
    this.history = [];
    // New random teams are drawn at the next start.
    for (const participant of this.participants.values()) participant.team = null;
    this.phase = 'LOBBY';
    this.broadcastState();
    return ok(null);
  }

  removeParticipant(socketId: string, participantId: string): Result<null> {
    if (!this.isHost(socketId)) return fail('NOT_HOST', 'Only the host can remove participants.');
    const participant = this.participants.get(participantId);
    if (!participant) return fail('NOT_IN_ROOM', 'Participant not found.');
    const team = participant.team;
    this.deleteParticipant(participant);
    this.deps.events.participantRemoved(participant.id, participant.socketId);
    this.broadcastState();
    if (team) {
      this.broadcastVotes(team);
      this.checkEveryoneVoted(team);
    }
    return ok(null);
  }

  // ---------------------------------------------------------- participants

  join(nickname: string, socketId: string, sessionToken?: string): Result<JoinedParticipant> {
    if (sessionToken) {
      const existing = [...this.participants.values()].find((p) => safeEqual(p.sessionToken, sessionToken));
      if (existing) {
        if (existing.graceTimer) this.deps.scheduler.clearTimeout(existing.graceTimer);
        existing.graceTimer = null;
        existing.socketId = socketId;
        existing.connected = true;
        this.broadcastState();
        return ok(this.describe(existing, true));
      }
    }
    if (this.phase !== 'LOBBY') return fail('GAME_IN_PROGRESS', 'The game has already started. Wait for the next game.');
    if (this.participants.size >= this.deps.config.maxParticipantsPerRoom) return fail('ROOM_FULL', 'This room is full.');
    const participant: Participant = {
      id: this.deps.createId('p'),
      nickname,
      team: null,
      sessionToken: this.deps.createToken(),
      socketId,
      connected: true,
      graceTimer: null,
    };
    this.participants.set(participant.id, participant);
    this.broadcastState();
    return ok(this.describe(participant, false));
  }

  /** Team of a participant (null before the game starts). */
  teamOf(participantId: string): TeamId | null {
    return this.participants.get(participantId)?.team ?? null;
  }

  submitVote(participantId: string, roundId: string, answer: AnswerId): Result<{ roundId: string; answer: AnswerId }> {
    const participant = this.participants.get(participantId);
    if (!participant) return fail('NOT_IN_ROOM', 'You are not in this room.');
    const team = participant.team;
    if (!team) return fail('NO_TEAM', 'Teams are picked when the game starts.');
    const run = this.teams[team];
    if (run.roundId !== roundId) return fail('STALE_ROUND', 'This question is no longer active.');
    if (this.paused) return fail('VOTING_CLOSED', 'The game is paused.');
    if (run.phase === 'TIE_BREAK') {
      if (!run.tieBreak?.includes(answer)) return fail('INVALID_ANSWER', 'Choose one of the tied answers.');
    } else if (run.phase !== 'VOTING') {
      return fail('VOTING_CLOSED', 'Voting is closed.');
    }
    run.votes.cast(participant.id, team, answer);
    this.broadcastVotes(team);
    this.checkEveryoneVoted(team);
    return ok({ roundId, answer });
  }

  participantDisconnected(participantId: string, socketId: string): void {
    const participant = this.participants.get(participantId);
    if (!participant || participant.socketId !== socketId) return;
    participant.connected = false;
    participant.socketId = null;
    participant.graceTimer = this.deps.scheduler.setTimeout(() => {
      participant.graceTimer = null;
      if (participant.connected) return;
      const team = participant.team;
      this.deleteParticipant(participant);
      this.broadcastState();
      if (team) this.broadcastVotes(team);
    }, this.deps.config.reconnectGraceMs);
    this.broadcastState();
    // The remaining players may all have voted already.
    if (participant.team) this.checkEveryoneVoted(participant.team);
  }

  // ------------------------------------------------------------- snapshot

  snapshot(): RoomSnapshot {
    const participants: ParticipantPublic[] = [...this.participants.values()].map((p) => ({
      id: p.id,
      nickname: p.nickname,
      team: p.team,
      connected: p.connected,
    }));
    const teams = {} as Record<TeamId, TeamSnapshot>;
    for (const team of TEAM_IDS) {
      const run = this.teams[team];
      const members = participants.filter((p) => p.team === team);
      const atDoors = run.phase === 'VOTING' || run.phase === 'TIE_BREAK' || run.phase === 'ANIMATING';
      const question = run.questions[run.roundIndex];
      teams[team] = {
        score: run.score,
        correctCount: run.correctCount,
        completedRounds: run.completedRounds,
        memberCount: members.length,
        connectedCount: members.filter((p) => p.connected).length,
        phase: run.phase,
        roundIndex: run.roundIndex,
        roundId: run.roundId,
        question: atDoors && question ? toPublicQuestion(question) : null,
        tieBreak: run.phase === 'TIE_BREAK' ? run.tieBreak : null,
        phaseEndsAt: this.paused ? null : run.timer.endsAt,
        phaseDurationMs: run.timer.duration,
        pausedRemainingMs: this.paused ? run.timer.remainingWhilePaused : null,
        tally: run.votes.tally(team),
        votedCount: this.votedCount(team),
        lastResult: run.lastResult,
        finishedAt: run.finishedAt,
        finishRank: run.finishRank,
      };
    }
    return {
      code: this.code,
      language: this.language,
      phase: this.phase,
      paused: this.paused,
      pauseReason: this.pauseReason,
      hostConnected: this.hostSocketId !== null,
      totalRounds: this.plannedRounds(),
      phaseEndsAt: this.paused ? null : this.countdown.endsAt,
      pausedRemainingMs: this.paused ? this.countdown.remainingWhilePaused : null,
      teams,
      participants,
      history: [...this.history],
      serverNow: this.deps.scheduler.now(),
    };
  }

  get currentPhase(): GamePhase {
    return this.phase;
  }

  teamPhase(team: TeamId): TeamPhase {
    return this.teams[team].phase;
  }

  get participantCount(): number {
    return this.participants.size;
  }

  dispose(): void {
    this.countdown.clear();
    for (const team of TEAM_IDS) this.teams[team].timer.clear();
    this.cancelHostExpiry();
    for (const participant of this.participants.values()) {
      if (participant.graceTimer) this.deps.scheduler.clearTimeout(participant.graceTimer);
    }
  }

  // ------------------------------------------------------------ race flow

  private beginRace(): void {
    if (this.phase !== 'COUNTDOWN') return;
    this.phase = 'PLAYING';
    for (const team of TEAM_IDS) this.startRun(team, 0);
    this.broadcastState();
  }

  /** Runs to door `index` (or finishes the race after the last door). */
  private startRun(team: TeamId, index: number): void {
    const run = this.teams[team];
    if (index >= run.questions.length) return this.finishTeam(team);
    run.phase = 'RUNNING';
    run.roundIndex = index;
    run.roundId = this.deps.createId('r');
    run.votes = new VoteBox();
    run.tieBreak = null;
    run.resolved = false;
    run.timer.schedule(this.deps.config.runMs, () => this.openVoting(team));
    this.deps.events.roundStarted({ team, roundId: run.roundId, roundIndex: index });
    this.broadcastState();
  }

  private openVoting(team: TeamId): void {
    const run = this.teams[team];
    if (run.phase !== 'RUNNING') return;
    run.phase = 'VOTING';
    run.timer.schedule(this.deps.config.votingMs, () => this.closeVoting(team));
    this.broadcastState();
    // A team without connected players does not wait 30 seconds at every door.
    this.checkEveryoneVoted(team);
  }

  /** Closes voting early once every connected team member has a valid vote. */
  private checkEveryoneVoted(team: TeamId): void {
    const run = this.teams[team];
    if (this.paused || (run.phase !== 'VOTING' && run.phase !== 'TIE_BREAK')) return;
    const connected = [...this.participants.values()].filter((p) => p.team === team && p.connected);
    const allIn = connected.every((p) => {
      const vote = run.votes.get(p.id);
      return vote !== null && (run.phase !== 'TIE_BREAK' || (run.tieBreak?.includes(vote) ?? false));
    });
    if (!allIn) return;
    if (run.phase === 'VOTING') this.closeVoting(team);
    else this.closeTieBreak(team);
  }

  private closeVoting(team: TeamId): void {
    const run = this.teams[team];
    if (run.phase !== 'VOTING' || run.resolved) return;
    const decision = decideMajority(run.votes.tally(team));
    if (decision.kind === 'winner') return this.resolve(team, decision.answer, 'majority');
    if (decision.kind === 'none') return this.resolve(team, null, 'noVotes');
    run.phase = 'TIE_BREAK';
    run.tieBreak = decision.leaders;
    run.timer.schedule(this.deps.config.tieBreakMs, () => this.closeTieBreak(team));
    if (run.roundId) {
      this.deps.events.tieBreak({ team, roundId: run.roundId, answers: decision.leaders, endsAt: run.timer.endsAt ?? 0 });
    }
    this.broadcastState();
  }

  private closeTieBreak(team: TeamId): void {
    const run = this.teams[team];
    if (run.phase !== 'TIE_BREAK' || run.resolved || !run.tieBreak) return;
    const leaders = run.tieBreak;
    const decision = decideMajority(run.votes.tally(team), leaders);
    if (decision.kind === 'winner') this.resolve(team, decision.answer, 'tieBreak');
    else this.resolve(team, pickRandom(leaders, this.deps.random), 'random');
  }

  /** Scores the door exactly once, then plays the result and moves on. */
  private resolve(team: TeamId, selected: AnswerId | null, decidedBy: DecisionMethod): void {
    const run = this.teams[team];
    const question = run.questions[run.roundIndex];
    if (run.resolved || !question || !run.roundId) return;
    run.resolved = true;
    run.timer.clear();

    const outcome = evaluateOutcome(selected, question.correctAnswer);
    const points = pointsFor(outcome, this.deps.config);
    run.score += points;
    run.completedRounds += 1;
    if (outcome === 'correct') run.correctCount += 1;
    const result: TeamRoundResult = {
      team,
      roundId: run.roundId,
      roundIndex: run.roundIndex,
      questionId: question.id,
      question: question.question,
      correctAnswer: question.correctAnswer,
      correctAnswerText: question.answers.find((a) => a.id === question.correctAnswer)?.text ?? '',
      explanation: question.explanation,
      selectedAnswer: selected,
      outcome,
      pointsAwarded: points,
      tally: run.votes.tally(team),
      decidedBy,
    };
    run.lastResult = result;
    this.history.push(result);

    run.phase = 'ANIMATING';
    const next = run.roundIndex + 1;
    const duration = outcome === 'correct' ? this.deps.config.passMs : this.deps.config.crashMs;
    run.timer.schedule(duration, () => this.startRun(team, next));
    this.deps.events.resolved(result);
    this.broadcastState();
  }

  private finishTeam(team: TeamId): void {
    const run = this.teams[team];
    run.phase = 'FINISHED';
    run.timer.clear();
    run.finishedAt = this.deps.scheduler.now();
    run.finishRank = TEAM_IDS.filter((t) => this.teams[t].finishedAt !== null).length;
    if (TEAM_IDS.every((t) => this.teams[t].phase === 'FINISHED')) {
      this.phase = 'GAME_OVER';
      this.deps.events.finished();
    }
    this.broadcastState();
  }

  // ------------------------------------------------------------- helpers

  private freshTeam(): TeamRun {
    return {
      phase: 'WAITING',
      roundIndex: -1,
      roundId: null,
      questions: [],
      votes: new VoteBox(),
      tieBreak: null,
      resolved: false,
      timer: new TimerSlot(this.deps.scheduler),
      score: 0,
      correctCount: 0,
      completedRounds: 0,
      lastResult: null,
      finishedAt: null,
      finishRank: null,
    };
  }

  private plannedRounds(): number {
    return Math.min(this.deps.config.roundsPerGame, Math.floor(this.deps.questions.length / 2));
  }

  /** Different questions for each team, never repeated within a game. */
  private pickQuestions(): Record<TeamId, Question[]> | null {
    const rounds = this.plannedRounds();
    if (rounds === 0) return null;
    const pool = [...this.deps.questions];
    if (this.deps.config.shuffleQuestions) this.shuffle(pool);
    return { A: pool.slice(0, rounds), B: pool.slice(rounds, rounds * 2) };
  }

  /** Random, balanced teams: sizes differ by at most one. */
  private assignTeams(): void {
    const players = [...this.participants.values()];
    this.shuffle(players);
    const first: TeamId = this.deps.random() < 0.5 ? 'A' : 'B';
    const second: TeamId = first === 'A' ? 'B' : 'A';
    players.forEach((participant, i) => {
      participant.team = i % 2 === 0 ? first : second;
    });
  }

  private shuffle<T>(items: T[]): void {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(this.deps.random() * (i + 1));
      const a = items[i];
      const b = items[j];
      if (a !== undefined && b !== undefined) {
        items[i] = b;
        items[j] = a;
      }
    }
  }

  private votedCount(team: TeamId): number {
    const run = this.teams[team];
    return [...this.participants.values()].filter((p) => p.team === team && p.connected && run.votes.get(p.id) !== null).length;
  }

  private isGameRunning(): boolean {
    return this.phase === 'COUNTDOWN' || this.phase === 'PLAYING';
  }

  private pauseInternal(reason: PauseReason): void {
    this.countdown.pause();
    for (const team of TEAM_IDS) this.teams[team].timer.pause();
    this.paused = true;
    this.pauseReason = reason;
    this.deps.events.paused();
    this.broadcastState();
  }

  private cancelHostExpiry(): void {
    if (this.hostExpiryTimer) this.deps.scheduler.clearTimeout(this.hostExpiryTimer);
    this.hostExpiryTimer = null;
  }

  private deleteParticipant(participant: Participant): void {
    if (participant.graceTimer) this.deps.scheduler.clearTimeout(participant.graceTimer);
    participant.graceTimer = null;
    this.participants.delete(participant.id);
    if (participant.team) {
      const run = this.teams[participant.team];
      if (!run.resolved) run.votes.remove(participant.id);
    }
  }

  private describe(participant: Participant, reconnected: boolean): JoinedParticipant {
    const run = participant.team ? this.teams[participant.team] : null;
    const answer = run ? run.votes.get(participant.id) : null;
    return {
      participantId: participant.id,
      sessionToken: participant.sessionToken,
      nickname: participant.nickname,
      team: participant.team,
      currentVote: run && run.roundId && answer && !run.resolved ? { roundId: run.roundId, answer } : null,
      reconnected,
    };
  }

  private broadcastState(): void {
    this.deps.events.state(this.snapshot());
  }

  private broadcastVotes(team: TeamId): void {
    const run = this.teams[team];
    if (!run.roundId) return;
    this.deps.events.votes({ team, roundId: run.roundId, tally: run.votes.tally(team), votedCount: this.votedCount(team) });
  }
}
