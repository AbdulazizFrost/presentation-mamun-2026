// Runtime validation of untrusted client payloads. Every handler on the server parses its input here first.

import { GAME_CONFIG } from '../config';
import { ANSWER_IDS, LANGUAGES, TEAM_IDS, type AnswerId, type Language, type TeamId } from '../types/game';
import type {
  HostResumePayload,
  JoinPayload,
  LanguagePayload,
  RemoveParticipantPayload,
  VotePayload,
} from './events';

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 5;
const ROOM_CODE_RE = new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`);
const TOKEN_RE = /^[A-Za-z0-9_-]{16,128}$/;
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeRoomCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const code = value.trim().toUpperCase();
  return ROOM_CODE_RE.test(code) ? code : null;
}

export function isTeamId(value: unknown): value is TeamId {
  return typeof value === 'string' && (TEAM_IDS as readonly string[]).includes(value);
}

export function isAnswerId(value: unknown): value is AnswerId {
  return typeof value === 'string' && (ANSWER_IDS as readonly string[]).includes(value);
}

/** Trims, collapses whitespace and strips control characters. Returns null when empty or too long. */
export function sanitizeNickname(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length < 1 || cleaned.length > GAME_CONFIG.maxNicknameLength) return null;
  return cleaned;
}

export function parseHostResume(payload: unknown): HostResumePayload | null {
  if (!isRecord(payload)) return null;
  const code = normalizeRoomCode(payload.code);
  const { hostToken } = payload;
  if (!code || typeof hostToken !== 'string' || !TOKEN_RE.test(hostToken)) return null;
  return { code, hostToken };
}

export function parseJoin(payload: unknown): JoinPayload | null {
  if (!isRecord(payload)) return null;
  const code = normalizeRoomCode(payload.code);
  const nickname = sanitizeNickname(payload.nickname);
  if (!code || !nickname) return null;
  const { sessionToken } = payload;
  if (sessionToken === undefined || sessionToken === null) return { code, nickname };
  if (typeof sessionToken !== 'string' || !TOKEN_RE.test(sessionToken)) return null;
  return { code, nickname, sessionToken };
}

export function parseVote(payload: unknown): VotePayload | null {
  if (!isRecord(payload)) return null;
  const { roundId, answer } = payload;
  if (typeof roundId !== 'string' || !ID_RE.test(roundId) || !isAnswerId(answer)) return null;
  return { roundId, answer };
}

export function parseLanguage(payload: unknown): LanguagePayload | null {
  if (!isRecord(payload)) return null;
  const { language } = payload;
  return LANGUAGES.includes(language as Language) ? { language: language as Language } : null;
}

export function parseRemoveParticipant(payload: unknown): RemoveParticipantPayload | null {
  if (!isRecord(payload)) return null;
  const { participantId } = payload;
  if (typeof participantId !== 'string' || !ID_RE.test(participantId)) return null;
  return { participantId };
}
