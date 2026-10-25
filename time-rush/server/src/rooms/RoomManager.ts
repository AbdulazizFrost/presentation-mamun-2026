import type { GameConfig } from '@shared/config';
import type { Question } from '@shared/types/game';
import type { Scheduler } from '../game/scheduler';
import { Room, type RoomEvents } from './Room';

export interface RoomManagerDeps {
  scheduler: Scheduler;
  config: GameConfig;
  questions: readonly Question[];
  random: () => number;
  createId: (prefix: string) => string;
  createToken: () => string;
  createRoomCode: () => string;
}

/**
 * In-memory room storage. Rooms live only as long as the server process —
 * a restart ends every game (documented limitation of this prototype).
 */
export class RoomManager {
  private readonly rooms = new Map<string, Room>();

  constructor(private readonly deps: RoomManagerDeps) {}

  /** Creates a room; `bindEvents` receives the room code and returns its broadcast handlers. */
  create(bindEvents: (code: string) => RoomEvents): { room: Room; hostToken: string } {
    let code = this.deps.createRoomCode();
    for (let attempts = 0; this.rooms.has(code); attempts++) {
      if (attempts > 50) throw new Error('Could not allocate a unique room code');
      code = this.deps.createRoomCode();
    }
    const hostToken = this.deps.createToken();
    const events = bindEvents(code);
    const room = new Room({
      code,
      hostToken,
      scheduler: this.deps.scheduler,
      config: this.deps.config,
      questions: this.deps.questions,
      random: this.deps.random,
      createId: this.deps.createId,
      createToken: this.deps.createToken,
      events: {
        ...events,
        expired: () => {
          events.expired();
          this.delete(code);
        },
      },
    });
    this.rooms.set(code, room);
    return { room, hostToken };
  }

  get(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  delete(code: string): void {
    this.rooms.get(code)?.dispose();
    this.rooms.delete(code);
  }

  get size(): number {
    return this.rooms.size;
  }
}
