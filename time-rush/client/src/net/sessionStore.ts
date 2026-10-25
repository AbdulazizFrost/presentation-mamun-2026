// Small localStorage wrappers. Storage can be unavailable (private mode), so every access is guarded.

export interface StoredHost {
  code: string;
  hostToken: string;
}

export interface StoredParticipant {
  code: string;
  sessionToken: string;
  nickname: string;
}

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore: the game still works, only automatic reconnection after a reload is lost.
  }
}

export const hostStore = {
  get: () => read<StoredHost>('timerush:host'),
  set: (value: StoredHost | null) => write('timerush:host', value),
};

export const participantStore = {
  get: (code: string) => read<StoredParticipant>(`timerush:participant:${code}`),
  set: (code: string, value: StoredParticipant | null) => write(`timerush:participant:${code}`, value),
  lastNickname: () => read<string>('timerush:nickname') ?? '',
  rememberNickname: (nickname: string) => write('timerush:nickname', nickname),
};
