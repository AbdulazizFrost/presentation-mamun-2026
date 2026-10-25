// End-to-end over real Socket.IO connections. Game time is driven by the fake scheduler,
// so no test waits for real deadlines.
import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server } from 'socket.io';
import { io as connect, type Socket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ClientToServerEvents, Result, ServerToClientEvents } from '@shared/protocol/events';
import type { RoomSnapshot } from '@shared/types/game';
import { RoomManager } from '../src/rooms/RoomManager';
import { registerHandlers, type GameServer, type SocketData } from '../src/socket/registerHandlers';
import { FakeScheduler, TEST_CONFIG, TEST_QUESTIONS } from './helpers';

type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let http: HttpServer;
let io: GameServer;
let scheduler: FakeScheduler;
let url: string;
const clients: ClientSocket[] = [];

beforeEach(async () => {
  scheduler = new FakeScheduler();
  http = createServer();
  io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(http);
  let n = 0;
  const rooms = new RoomManager({
    scheduler,
    config: TEST_CONFIG,
    questions: TEST_QUESTIONS,
    random: () => 0,
    createId: (prefix) => `${prefix}${++n}`,
    createToken: () => `tok${++n}-abcdefghijklmnopqrstuv`,
    createRoomCode: () => 'QWERT',
  });
  registerHandlers({ io, rooms, scheduler, buildJoinUrl: (code) => ({ url: `http://test/join?room=${code}`, isPublic: false }) });
  await new Promise<void>((resolve) => http.listen(0, resolve));
  url = `http://localhost:${(http.address() as AddressInfo).port}`;
});

afterEach(async () => {
  for (const client of clients.splice(0)) client.disconnect();
  await new Promise<void>((resolve) => io.close(() => resolve()));
});

async function client(): Promise<ClientSocket> {
  const socket: ClientSocket = connect(url, { transports: ['websocket'], forceNew: true });
  clients.push(socket);
  await new Promise<void>((resolve) => socket.once('connect', () => resolve()));
  return socket;
}

/** Sends a raw event with arbitrary arguments and resolves with the ack. */
function emitRaw(socket: ClientSocket, event: string, ...args: unknown[]): Promise<Result<unknown>> {
  return new Promise((resolve) => {
    (socket.emit as unknown as (e: string, ...a: unknown[]) => void)(event, ...args, (res: Result<unknown>) => resolve(res));
  });
}

const nextState = (socket: ClientSocket, predicate: (s: RoomSnapshot) => boolean) =>
  new Promise<RoomSnapshot>((resolve) => {
    const handler = (s: RoomSnapshot) => {
      if (predicate(s)) {
        socket.off('room:state', handler);
        resolve(s);
      }
    };
    socket.on('room:state', handler);
  });

describe('Socket.IO integration', () => {
  it('runs a round end-to-end: create, join, teams, vote, resolve', async () => {
    const host = await client();
    const created = (await emitRaw(host, 'room:create')) as Extract<Result<{ code: string; hostToken: string }>, { ok: true }>;
    expect(created.ok).toBe(true);
    const code = created.data.code;

    const phones = await Promise.all([client(), client(), client(), client()]);
    const ids: string[] = [];
    for (const [i, phone] of phones.entries()) {
      const joined = (await emitRaw(phone, 'room:join', { code, nickname: `p${i}` })) as { ok: true; data: { participantId: string; team: null } };
      expect(joined.ok).toBe(true);
      expect(joined.data.team).toBeNull();
      ids.push(joined.data.participantId);
    }

    expect((await emitRaw(host, 'game:start')).ok).toBe(true);
    // Nobody can join once the game has started.
    const late = await client();
    expect(await emitRaw(late, 'room:join', { code, nickname: 'Late' })).toMatchObject({ ok: false, error: 'GAME_IN_PROGRESS' });

    scheduler.advance(TEST_CONFIG.countdownMs + TEST_CONFIG.runMs);
    const state = (await emitRaw(host, 'game:requestState')) as { ok: true; data: RoomSnapshot };
    expect(state.data.teams.A.phase).toBe('VOTING');
    const teamOf = new Map(state.data.participants.map((p) => [p.id, p.team]));
    expect([...teamOf.values()].filter((t) => t === 'A')).toHaveLength(2);

    const results: { team: string; outcome: string }[] = [];
    host.on('round:resolved', (r) => results.push(r));
    for (const [i, phone] of phones.entries()) {
      const team = teamOf.get(ids[i]!) as 'A' | 'B';
      // Team A answers q1 (correct A) correctly; Team B answers q4 (correct A) wrongly.
      const answer = team === 'A' ? 'A' : 'C';
      expect((await emitRaw(phone, 'vote:submit', { roundId: state.data.teams[team].roundId, answer })).ok).toBe(true);
    }
    // Everyone voted, so both teams resolved at once without waiting 30 seconds.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(results.find((r) => r.team === 'A')?.outcome).toBe('correct');
    expect(results.find((r) => r.team === 'B')?.outcome).toBe('wrong');
  });

  it('rejects host actions from a participant socket and malformed payloads', async () => {
    const host = await client();
    const created = (await emitRaw(host, 'room:create')) as { ok: true; data: { code: string } };
    const phone = await client();
    await emitRaw(phone, 'room:join', { code: created.data.code, nickname: 'Eve' });

    expect(await emitRaw(phone, 'game:start')).toMatchObject({ ok: false, error: 'NOT_HOST' });
    expect(await emitRaw(phone, 'game:restart')).toMatchObject({ ok: false, error: 'NOT_HOST' });
    expect(await emitRaw(phone, 'room:join', { code: 42 })).toMatchObject({ ok: false, error: 'INVALID_PAYLOAD' });
    expect(await emitRaw(phone, 'vote:submit', 'garbage')).toMatchObject({ ok: false, error: 'INVALID_PAYLOAD' });
    expect(await emitRaw(phone, 'room:join', { code: 'ZZZZZ', nickname: 'Eve' })).toMatchObject({ ok: false, error: 'ROOM_NOT_FOUND' });
    // A message without an ack must not crash the server.
    (phone.emit as unknown as (e: string, a: unknown) => void)('vote:submit', { nonsense: true });
    expect((await emitRaw(host, 'game:requestState')).ok).toBe(true);
  });

  it('restores a participant after the socket reconnects', async () => {
    const host = await client();
    const created = (await emitRaw(host, 'room:create')) as { ok: true; data: { code: string } };
    const phone = await client();
    const first = (await emitRaw(phone, 'room:join', { code: created.data.code, nickname: 'Ali' })) as {
      ok: true;
      data: { participantId: string; sessionToken: string };
    };
    const offline = nextState(host, (s) => s.participants.some((p) => !p.connected));
    phone.disconnect();
    await offline;

    const again = await client();
    const second = (await emitRaw(again, 'room:join', {
      code: created.data.code,
      nickname: 'Ali',
      sessionToken: first.data.sessionToken,
    })) as { ok: true; data: { participantId: string; team: string | null; snapshot: RoomSnapshot } };
    expect(second.data.participantId).toBe(first.data.participantId);
    expect(second.data.team).toBeNull();
    expect(second.data.snapshot.participants).toHaveLength(1);
    expect(second.data.snapshot.participants[0]?.connected).toBe(true);
  });
});
