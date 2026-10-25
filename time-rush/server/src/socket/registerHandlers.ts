import type { Server, Socket } from 'socket.io';
import { RATE_LIMITS } from '@shared/config';
import type {
  ClientToServerEvents,
  ErrorCode,
  HostSession,
  Result,
  ServerToClientEvents,
} from '@shared/protocol/events';
import {
  parseHostResume,
  parseJoin,
  parseLanguage,
  parseRemoveParticipant,
  parseVote,
} from '@shared/protocol/validate';
import type { Scheduler } from '../game/scheduler';
import type { Room, RoomEvents } from '../rooms/Room';
import type { RoomManager } from '../rooms/RoomManager';
import { KeyedRateLimiter, TokenBucket } from './rateLimit';

export interface SocketData {
  roomCode?: string;
  role?: 'host' | 'participant';
  participantId?: string;
}

export type GameServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

/**
 * Socket.IO's typed `on()` assumes well-formed arguments. Clients are untrusted, so handlers are
 * registered through this untyped view and every argument is validated before use.
 */
interface RawSocket {
  on(event: string, listener: (...args: unknown[]) => void): void;
}

type AckFn = (result: Result<unknown>) => void;

export interface HandlerOptions {
  io: GameServer;
  rooms: RoomManager;
  scheduler: Scheduler;
  buildJoinUrl: (code: string) => { url: string; isPublic: boolean };
  log?: (message: string) => void;
}

const fail = (error: ErrorCode, message: string): Result<never> => ({ ok: false, error, message });

export function registerHandlers({ io, rooms, scheduler, buildJoinUrl, log = () => {} }: HandlerOptions): void {
  const createLimiter = new KeyedRateLimiter(RATE_LIMITS.roomCreate, scheduler);

  const roomEvents = (code: string): RoomEvents => ({
    state: (snapshot) => io.to(code).emit('room:state', snapshot),
    votes: (update) => io.to(code).emit('vote:updated', update),
    roundStarted: (payload) => io.to(code).emit('round:started', payload),
    tieBreak: (payload) => io.to(code).emit('round:tieBreak', payload),
    resolved: (result) => io.to(code).emit('round:resolved', result),
    paused: () => io.to(code).emit('game:paused'),
    resumed: () => io.to(code).emit('game:resumed'),
    finished: () => io.to(code).emit('game:finished'),
    participantRemoved: (_participantId, socketId) => {
      if (!socketId) return;
      const target = io.sockets.sockets.get(socketId);
      target?.emit('participant:removed');
      target?.leave(code);
      if (target) target.data = {};
    },
    expired: () => {
      log(`room ${code} expired (host did not return)`);
      io.to(code).emit('error', { code: 'ROOM_NOT_FOUND', message: 'This game has ended.' });
      io.in(code).socketsLeave(code);
    },
  });

  io.on('connection', (typedSocket: GameSocket) => {
    const socket = typedSocket as unknown as RawSocket;
    const voteBucket = new TokenBucket(RATE_LIMITS.vote, scheduler);
    const generalBucket = new TokenBucket(RATE_LIMITS.general, scheduler);
    const clientIp = typedSocket.handshake.address || 'unknown';

    /** Registers a handler; the ack is always the last function argument, the payload the first non-function one. */
    const on = (event: keyof ClientToServerEvents, handler: (payload: unknown, ack: AckFn) => void) => {
      socket.on(event, (...args: unknown[]) => {
        const last = args.at(-1);
        const ack: AckFn = typeof last === 'function' ? (last as AckFn) : () => {};
        const payload = args.length > 1 || typeof last !== 'function' ? args[0] : undefined;
        if (event !== 'vote:submit' && !generalBucket.take()) {
          ack(fail('RATE_LIMITED', 'Too many requests. Slow down.'));
          return;
        }
        try {
          handler(payload, ack);
        } catch (error) {
          log(`handler ${event} failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
          ack(fail('INTERNAL', 'Something went wrong on the server.'));
        }
      });
    };

    const currentRoom = (): Room | undefined => {
      const code = typedSocket.data.roomCode;
      return code ? rooms.get(code) : undefined;
    };

    const hostSession = (room: Room, hostToken: string): HostSession => {
      const join = buildJoinUrl(room.code);
      return { code: room.code, hostToken, joinUrl: join.url, joinUrlIsPublic: join.isPublic, snapshot: room.snapshot() };
    };

    const bindTo = (room: Room, role: 'host' | 'participant', participantId?: string) => {
      const previous = typedSocket.data.roomCode;
      if (previous && previous !== room.code) void typedSocket.leave(previous);
      typedSocket.data = participantId ? { roomCode: room.code, role, participantId } : { roomCode: room.code, role };
      void typedSocket.join(room.code);
    };

    on('room:create', (_payload, ack) => {
      if (!createLimiter.take(clientIp)) return ack(fail('RATE_LIMITED', 'Too many rooms created. Wait a minute.'));
      const { room, hostToken } = rooms.create(roomEvents);
      room.attachHost(typedSocket.id);
      bindTo(room, 'host');
      log(`room ${room.code} created`);
      ack({ ok: true, data: hostSession(room, hostToken) });
    });

    on('host:resume', (payload, ack) => {
      const parsed = parseHostResume(payload);
      if (!parsed) return ack(fail('INVALID_PAYLOAD', 'Invalid host session.'));
      const room = rooms.get(parsed.code);
      if (!room) return ack(fail('ROOM_NOT_FOUND', 'This game no longer exists. The server may have restarted.'));
      const result = room.resumeHost(parsed.hostToken, typedSocket.id);
      if (!result.ok) return ack(result);
      bindTo(room, 'host');
      ack({ ok: true, data: hostSession(room, parsed.hostToken) });
    });

    on('room:join', (payload, ack) => {
      const parsed = parseJoin(payload);
      if (!parsed) return ack(fail('INVALID_PAYLOAD', 'Enter a valid room code and a name (1–20 characters).'));
      const room = rooms.get(parsed.code);
      if (!room) return ack(fail('ROOM_NOT_FOUND', 'Room not found. Check the code on the screen.'));
      const result = room.join(parsed.nickname, typedSocket.id, parsed.sessionToken);
      if (!result.ok) return ack(result);
      const joined = result.data;
      bindTo(room, 'participant', joined.participantId);
      ack({
        ok: true,
        data: {
          code: room.code,
          participantId: joined.participantId,
          sessionToken: joined.sessionToken,
          nickname: joined.nickname,
          team: joined.team,
          currentVote: joined.currentVote,
          snapshot: room.snapshot(),
        },
      });
    });

    on('vote:submit', (payload, ack) => {
      if (!voteBucket.take()) return ack(fail('RATE_LIMITED', 'Too many votes. Slow down.'));
      const parsed = parseVote(payload);
      if (!parsed) return ack(fail('INVALID_PAYLOAD', 'Invalid vote.'));
      const room = currentRoom();
      const participantId = typedSocket.data.participantId;
      if (!room || !participantId) return ack(fail('NOT_IN_ROOM', 'Join a room first.'));
      ack(room.submitVote(participantId, parsed.roundId, parsed.answer));
    });

    const hostAction = (event: 'game:start' | 'game:pause' | 'game:resume' | 'game:restart', run: (room: Room) => Result<null>) => {
      on(event, (_payload, ack) => {
        const room = currentRoom();
        if (!room) return ack(fail('ROOM_NOT_FOUND', 'Room not found.'));
        // Authorization is checked by the room against the registered host socket, not by the UI.
        const result = run(room);
        log(`${event} in ${room.code}: ${result.ok ? 'ok' : result.error}`);
        ack(result);
      });
    };
    hostAction('game:start', (room) => room.start(typedSocket.id));
    hostAction('game:pause', (room) => room.pause(typedSocket.id));
    hostAction('game:resume', (room) => room.resume(typedSocket.id));
    hostAction('game:restart', (room) => room.restart(typedSocket.id));

    on('host:removeParticipant', (payload, ack) => {
      const parsed = parseRemoveParticipant(payload);
      if (!parsed) return ack(fail('INVALID_PAYLOAD', 'Invalid participant.'));
      const room = currentRoom();
      if (!room) return ack(fail('ROOM_NOT_FOUND', 'Room not found.'));
      ack(room.removeParticipant(typedSocket.id, parsed.participantId));
    });

    on('host:setLanguage', (payload, ack) => {
      const parsed = parseLanguage(payload);
      if (!parsed) return ack(fail('INVALID_PAYLOAD', 'Invalid language.'));
      const room = currentRoom();
      if (!room) return ack(fail('ROOM_NOT_FOUND', 'Room not found.'));
      ack(room.setLanguage(typedSocket.id, parsed.language));
    });

    on('game:requestState', (_payload, ack) => {
      const room = currentRoom();
      if (!room) return ack(fail('ROOM_NOT_FOUND', 'Room not found.'));
      ack({ ok: true, data: room.snapshot() });
    });

    typedSocket.on('disconnect', () => {
      const room = currentRoom();
      if (!room) return;
      const { role, participantId } = typedSocket.data;
      if (role === 'host') room.hostDisconnected(typedSocket.id);
      else if (role === 'participant' && participantId) room.participantDisconnected(participantId, typedSocket.id);
    });
  });
}
