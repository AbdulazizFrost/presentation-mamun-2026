import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, Result, ServerToClientEvents } from '@shared/protocol/events';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/** Creates a socket to the same origin (Vite proxies /socket.io to the server in development). */
export function createSocket(): GameSocket {
  return io({
    autoConnect: false, // useRoom connects on mount
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
    transports: ['websocket', 'polling'],
  });
}

type AckEvents = {
  [K in keyof ClientToServerEvents]: Parameters<ClientToServerEvents[K]> extends [...infer _P, infer A] ? A : never;
};
type AckData<K extends keyof ClientToServerEvents> = AckEvents[K] extends (result: Result<infer T>) => void ? T : never;
type Payload<K extends keyof ClientToServerEvents> = Parameters<ClientToServerEvents[K]> extends [infer P, unknown]
  ? [P]
  : [];

const TIMEOUT_MS = 8000;

/** Emits a request and resolves with the server's Result (or a timeout error). */
export function request<K extends keyof ClientToServerEvents>(
  socket: GameSocket,
  event: K,
  ...payload: Payload<K>
): Promise<Result<AckData<K>>> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(
      () => resolve({ ok: false, error: 'INTERNAL', message: 'The server did not answer. Check the connection.' }),
      TIMEOUT_MS,
    );
    const ack = (result: Result<AckData<K>>) => {
      window.clearTimeout(timer);
      resolve(result);
    };
    // The typed emit signature cannot be expressed generically over K; the arguments match ClientToServerEvents[K].
    (socket.emit as unknown as (event: string, ...args: unknown[]) => void)(event, ...payload, ack);
  });
}
