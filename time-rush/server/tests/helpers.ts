import { GAME_CONFIG, type GameConfig } from '@shared/config';
import type { Question, RoomSnapshot, TeamRoundResult } from '@shared/types/game';
import type { Scheduler, TimerHandle } from '../src/game/scheduler';
import type { RoomEvents } from '../src/rooms/Room';
import { RoomManager } from '../src/rooms/RoomManager';

/** Deterministic clock: timers only fire when the test calls advance(). */
export class FakeScheduler implements Scheduler {
  private time = 1_000_000;
  private nextId = 1;
  private timers = new Map<number, { at: number; callback: () => void }>();

  now(): number {
    return this.time;
  }

  setTimeout(callback: () => void, ms: number): TimerHandle {
    const id = this.nextId++;
    this.timers.set(id, { at: this.time + Math.max(0, ms), callback });
    return { id };
  }

  clearTimeout(handle: TimerHandle): void {
    this.timers.delete(handle.id);
  }

  advance(ms: number): void {
    const target = this.time + ms;
    for (;;) {
      let nextId: number | null = null;
      let nextAt = Infinity;
      for (const [id, timer] of this.timers) {
        if (timer.at <= target && timer.at < nextAt) {
          nextAt = timer.at;
          nextId = id;
        }
      }
      if (nextId === null) break;
      const timer = this.timers.get(nextId);
      this.timers.delete(nextId);
      this.time = nextAt;
      timer?.callback();
    }
    this.time = target;
  }
}

export const TEST_CONFIG: GameConfig = {
  ...GAME_CONFIG,
  roundsPerGame: 3,
  shuffleQuestions: false,
  countdownMs: 1000,
  runMs: 2000,
  votingMs: 30000,
  tieBreakMs: 5000,
  passMs: 1000,
  crashMs: 1500,
  reconnectGraceMs: 5000,
  hostReconnectGraceMs: 60000,
  maxParticipantsPerRoom: 50,
};

/** Without shuffling Team A gets q1–q3 and Team B q4–q6.
 * Correct answers: Team A doors: A, B, C. Team B doors: A, B, C. */
export const TEST_QUESTIONS: Question[] = [
  {
    id: 'q1',
    topic: 'test',
    question: 'Question 1?',
    answers: [
      { id: 'A', text: 'one' },
      { id: 'B', text: 'two' },
      { id: 'C', text: 'three' },
    ],
    correctAnswer: 'A',
    explanation: 'A is right.',
  },
  {
    id: 'q2',
    topic: 'test',
    question: 'Question 2?',
    answers: [
      { id: 'A', text: 'one' },
      { id: 'B', text: 'two' },
      { id: 'C', text: 'three' },
    ],
    correctAnswer: 'B',
    explanation: 'B is right.',
  },
  {
    id: 'q3',
    topic: 'test',
    question: 'Question 3?',
    answers: [
      { id: 'A', text: 'one' },
      { id: 'B', text: 'two' },
      { id: 'C', text: 'three' },
    ],
    correctAnswer: 'C',
    explanation: 'C is right.',
  },
  {
    id: 'q4',
    topic: 'test',
    question: 'Question 4?',
    answers: [
      { id: 'A', text: 'one' },
      { id: 'B', text: 'two' },
      { id: 'C', text: 'three' },
    ],
    correctAnswer: 'A',
    explanation: 'A is right.',
  },
  {
    id: 'q5',
    topic: 'test',
    question: 'Question 5?',
    answers: [
      { id: 'A', text: 'one' },
      { id: 'B', text: 'two' },
      { id: 'C', text: 'three' },
    ],
    correctAnswer: 'B',
    explanation: 'B is right.',
  },
  {
    id: 'q6',
    topic: 'test',
    question: 'Question 6?',
    answers: [
      { id: 'A', text: 'one' },
      { id: 'B', text: 'two' },
      { id: 'C', text: 'three' },
    ],
    correctAnswer: 'C',
    explanation: 'C is right.',
  },
];

export interface Recorded {
  states: RoomSnapshot[];
  resolved: TeamRoundResult[];
  removed: string[];
  finished: number;
  expired: number;
}

export function setup(overrides: Partial<GameConfig> = {}, random: () => number = () => 0) {
  const scheduler = new FakeScheduler();
  const recorded: Recorded = { states: [], resolved: [], removed: [], finished: 0, expired: 0 };
  let counter = 0;
  const events: RoomEvents = {
    state: (s) => recorded.states.push(s),
    votes: () => {},
    roundStarted: () => {},
    tieBreak: () => {},
    resolved: (r) => recorded.resolved.push(r),
    paused: () => {},
    resumed: () => {},
    finished: () => {
      recorded.finished++;
    },
    participantRemoved: (id) => recorded.removed.push(id),
    expired: () => {
      recorded.expired++;
    },
  };
  const manager = new RoomManager({
    scheduler,
    config: { ...TEST_CONFIG, ...overrides },
    questions: TEST_QUESTIONS,
    random,
    createId: (prefix) => `${prefix}${++counter}`,
    createToken: () => `token-${++counter}-abcdefghijklmnop`,
    createRoomCode: () => 'ABCDE',
  });
  const { room, hostToken } = manager.create(() => events);
  room.attachHost('host-socket');
  return { scheduler, recorded, manager, room, hostToken, config: { ...TEST_CONFIG, ...overrides } };
}

/** Joins a participant in the lobby (teams are assigned at random on start). */
export function addPlayer(room: ReturnType<typeof setup>['room'], name: string) {
  const joined = room.join(name, `socket-${name}`);
  if (!joined.ok) throw new Error(joined.message);
  return joined.data;
}

/** Splits participant ids by the team the server assigned. */
export function byTeam(room: ReturnType<typeof setup>['room'], ids: string[]) {
  return {
    A: ids.filter((id) => room.teamOf(id) === 'A'),
    B: ids.filter((id) => room.teamOf(id) === 'B'),
  };
}
