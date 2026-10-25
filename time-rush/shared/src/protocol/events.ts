// Strongly typed Socket.IO protocol shared by client and server.
// Requests use acknowledgement callbacks that always receive a Result.

import type { AnswerId, Language, RoomSnapshot, TeamId, TeamRoundResult, VoteTally } from '../types/game';

export type ErrorCode =
  | 'INVALID_PAYLOAD'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'NOT_HOST'
  | 'NOT_IN_ROOM'
  | 'SESSION_INVALID'
  | 'GAME_IN_PROGRESS'
  | 'NO_TEAM'
  | 'VOTING_CLOSED'
  | 'STALE_ROUND'
  | 'INVALID_ANSWER'
  | 'NOT_IN_TIE_BREAK'
  | 'INVALID_STATE'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export type Result<T> = { ok: true; data: T } | { ok: false; error: ErrorCode; message: string };

export type Ack<T> = (result: Result<T>) => void;

// ---- Client -> Server payloads ----

export interface HostResumePayload {
  code: string;
  hostToken: string;
}

export interface JoinPayload {
  code: string;
  nickname: string;
  /** Present when a phone reconnects with a previously issued session. */
  sessionToken?: string;
}

export interface VotePayload {
  roundId: string;
  answer: AnswerId;
}

export interface LanguagePayload {
  language: Language;
}

export interface RemoveParticipantPayload {
  participantId: string;
}

// ---- Responses ----

export interface HostSession {
  code: string;
  hostToken: string;
  joinUrl: string;
  /** False when the join URL is a LAN development address rather than a configured public URL. */
  joinUrlIsPublic: boolean;
  snapshot: RoomSnapshot;
}

export interface ParticipantSession {
  code: string;
  participantId: string;
  sessionToken: string;
  nickname: string;
  /** Null in the lobby: teams are assigned at random when the game starts. */
  team: TeamId | null;
  /** The participant's active vote in the current round, restored after reconnection. */
  currentVote: { roundId: string; answer: AnswerId } | null;
  snapshot: RoomSnapshot;
}

// ---- Server -> Client payloads ----

export interface VoteUpdate {
  team: TeamId;
  roundId: string;
  tally: VoteTally;
  votedCount: number;
}

export interface RoundStarted {
  team: TeamId;
  roundId: string;
  roundIndex: number;
}

export interface TieBreakStarted {
  team: TeamId;
  roundId: string;
  answers: AnswerId[];
  endsAt: number;
}

export interface ServerError {
  code: ErrorCode;
  message: string;
}

export interface ClientToServerEvents {
  'room:create': (ack: Ack<HostSession>) => void;
  'host:resume': (payload: HostResumePayload, ack: Ack<HostSession>) => void;
  'room:join': (payload: JoinPayload, ack: Ack<ParticipantSession>) => void;
  'game:start': (ack: Ack<null>) => void;
  'game:pause': (ack: Ack<null>) => void;
  'game:resume': (ack: Ack<null>) => void;
  'game:restart': (ack: Ack<null>) => void;
  'vote:submit': (payload: VotePayload, ack: Ack<{ roundId: string; answer: AnswerId }>) => void;
  'host:removeParticipant': (payload: RemoveParticipantPayload, ack: Ack<null>) => void;
  'host:setLanguage': (payload: LanguagePayload, ack: Ack<null>) => void;
  'game:requestState': (ack: Ack<RoomSnapshot>) => void;
}

export interface ServerToClientEvents {
  'room:state': (snapshot: RoomSnapshot) => void;
  'vote:updated': (update: VoteUpdate) => void;
  'round:started': (payload: RoundStarted) => void;
  'round:tieBreak': (payload: TieBreakStarted) => void;
  'round:resolved': (result: TeamRoundResult) => void;
  'game:paused': () => void;
  'game:resumed': () => void;
  'game:finished': () => void;
  'participant:removed': () => void;
  error: (error: ServerError) => void;
}
