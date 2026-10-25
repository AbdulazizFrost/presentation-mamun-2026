import { randomBytes, randomInt } from 'node:crypto';
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '@shared/protocol/validate';

/** Unguessable secret for host and participant sessions. */
export function createToken(): string {
  return randomBytes(24).toString('base64url');
}

export function createId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString('base64url')}`;
}

export function createRoomCode(): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)];
  }
  return code;
}
