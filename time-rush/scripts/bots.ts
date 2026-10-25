// Rehearsal helper: joins N bot "students" to a room before the game starts; they vote by themselves.
// Teams are assigned at random by the server when the host presses START.
//   npm run bots -- ROOMCODE [count=8] [serverUrl=http://localhost:3001]
import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@shared/protocol/events';
import { ANSWER_IDS, type AnswerId, type RoomSnapshot, type TeamId } from '@shared/types/game';

const [codeArg, countArg, urlArg] = process.argv.slice(2);
if (!codeArg) {
  console.error('Usage: npm run bots -- ROOMCODE [count] [serverUrl]');
  process.exit(1);
}
const code = codeArg.toUpperCase();
const count = Math.max(1, Math.min(60, Number(countArg ?? 8)));
const url = urlArg ?? `http://localhost:${process.env.SERVER_PORT ?? 3001}`;
const NAMES = ['Aziz', 'Malika', 'Bekzod', 'Sevara', 'Diyor', 'Nilufar', 'Jasur', 'Madina', 'Otabek', 'Kamola', 'Sardor', 'Zarina'];

type BotSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

function emit(socket: BotSocket, event: string, ...args: unknown[]): Promise<{ ok: boolean; message?: string; data?: unknown }> {
  return new Promise((resolve) => (socket.emit as unknown as (e: string, ...a: unknown[]) => void)(event, ...args, resolve));
}

const pick = (from: readonly AnswerId[] = ANSWER_IDS): AnswerId => from[Math.floor(Math.random() * from.length)] ?? 'A';

for (let i = 0; i < count; i++) {
  const socket: BotSocket = io(url, { transports: ['websocket'], forceNew: true });
  const name = `${NAMES[i % NAMES.length]}${i >= NAMES.length ? i : ''} 🤖`.slice(0, 20);
  let myId: string | null = null;
  let team: TeamId | null = null;
  let votedRound: string | null = null;
  let tieRound: string | null = null;

  socket.on('connect', async () => {
    const joined = await emit(socket, 'room:join', { code, nickname: name });
    if (!joined.ok) {
      console.error(`${name}: ${joined.message}`);
      socket.disconnect();
      return;
    }
    myId = (joined.data as { participantId: string }).participantId;
    console.log(`${name} joined, waiting for the start`);
  });

  socket.on('room:state', (snapshot: RoomSnapshot) => {
    const assigned = snapshot.participants.find((p) => p.id === myId)?.team ?? null;
    if (assigned && assigned !== team) console.log(`${name} -> TEAM ${assigned}`);
    team = assigned;
    if (!team || snapshot.paused) return;
    const mine = snapshot.teams[team];
    const roundId = mine.roundId;
    if (!roundId) return;
    if (mine.phase === 'VOTING' && votedRound !== roundId) {
      votedRound = roundId;
      // Vote after a human-like delay; sometimes change the answer once.
      setTimeout(() => void emit(socket, 'vote:submit', { roundId, answer: pick() }), 1500 + Math.random() * 12000);
      if (Math.random() < 0.2) setTimeout(() => void emit(socket, 'vote:submit', { roundId, answer: pick() }), 14000 + Math.random() * 6000);
    }
    const allowed = mine.tieBreak;
    if (mine.phase === 'TIE_BREAK' && allowed?.length && tieRound !== roundId) {
      tieRound = roundId;
      setTimeout(() => void emit(socket, 'vote:submit', { roundId, answer: pick(allowed) }), 300 + Math.random() * 2500);
    }
  });

  socket.on('participant:removed', () => {
    console.log(`${name} was removed by the host`);
    socket.disconnect();
  });
}

console.log(`Connecting ${count} bots to room ${code} at ${url}. Start the game on the host screen. Ctrl+C to stop.`);
