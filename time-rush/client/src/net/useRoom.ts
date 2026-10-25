import { useEffect, useMemo, useRef, useState } from 'react';
import type { VoteUpdate } from '@shared/protocol/events';
import type { RoomSnapshot, TeamRoundResult } from '@shared/types/game';
import { createSocket, type GameSocket } from './socket';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting';

export interface RoomStore {
  socket: GameSocket;
  status: ConnectionStatus;
  snapshot: RoomSnapshot | null;
  /** Server clock minus local clock, for countdowns that match the server deadline. */
  clockOffset: number;
  setSnapshot: (snapshot: RoomSnapshot) => void;
}

/**
 * Owns one socket for the page and keeps the latest authoritative room snapshot.
 * Vote updates patch the tallies in between full snapshots.
 */
export function useRoom(handlers: {
  onResolved?: (result: TeamRoundResult) => void;
  /** Called on every (re)connection: pages (re)attach their host or participant session here. */
  onConnect?: (socket: GameSocket) => void;
  onRemoved?: () => void;
  onRoomGone?: (message: string) => void;
} = {}): RoomStore {
  const socket = useMemo(() => createSocket(), []);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [snapshot, setSnapshotState] = useState<RoomSnapshot | null>(null);
  const [clockOffset, setClockOffset] = useState(0);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const setSnapshot = useMemo(
    () => (next: RoomSnapshot) => {
      setClockOffset(next.serverNow - Date.now());
      setSnapshotState(next);
    },
    [],
  );

  useEffect(() => {
    let hadConnection = false;
    const onConnect = () => {
      setStatus('connected');
      hadConnection = true;
      handlersRef.current.onConnect?.(socket);
    };
    const onDisconnect = () => setStatus(hadConnection ? 'reconnecting' : 'connecting');
    const onState = (next: RoomSnapshot) => setSnapshot(next);
    const onVotes = (update: VoteUpdate) =>
      setSnapshotState((current) => {
        const team = current?.teams[update.team];
        if (!current || !team || team.roundId !== update.roundId) return current;
        return {
          ...current,
          teams: { ...current.teams, [update.team]: { ...team, tally: update.tally, votedCount: update.votedCount } },
        };
      });
    const onResolved = (result: TeamRoundResult) => handlersRef.current.onResolved?.(result);
    const onRemoved = () => handlersRef.current.onRemoved?.();
    const onError = (error: { code: string; message: string }) => {
      if (error.code === 'ROOM_NOT_FOUND') handlersRef.current.onRoomGone?.(error.message);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:state', onState);
    socket.on('vote:updated', onVotes);
    socket.on('round:resolved', onResolved);
    socket.on('participant:removed', onRemoved);
    socket.on('error', onError);
    if (socket.connected) onConnect();
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:state', onState);
      socket.off('vote:updated', onVotes);
      socket.off('round:resolved', onResolved);
      socket.off('participant:removed', onRemoved);
      socket.off('error', onError);
    };
  }, [socket, setSnapshot]);

  // Connect on mount, disconnect on unmount. The disconnect is deferred so React StrictMode's
  // mount -> unmount -> mount in development does not tear down a half-open connection.
  const disconnectTimer = useRef<number | null>(null);
  useEffect(() => {
    if (disconnectTimer.current !== null) window.clearTimeout(disconnectTimer.current);
    disconnectTimer.current = null;
    if (!socket.connected && !socket.active) socket.connect();
    return () => {
      disconnectTimer.current = window.setTimeout(() => socket.disconnect(), 200);
    };
  }, [socket]);

  return { socket, status, snapshot, clockOffset, setSnapshot };
}

/** Re-renders ~10 times per second and returns the current server time. */
export function useServerNow(clockOffset: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, []);
  return now + clockOffset;
}

/** Milliseconds left of a timed phase, given its end time and the paused remainder. */
export function remainingMs(endsAt: number | null, pausedRemaining: number | null, serverNow: number): number | null {
  if (pausedRemaining !== null) return pausedRemaining;
  if (endsAt === null) return null;
  return Math.max(0, endsAt - serverNow);
}
