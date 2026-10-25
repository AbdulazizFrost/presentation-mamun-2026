import type { RoomSnapshot } from '@shared/types/game';
import type { Texts } from '../../i18n';

export function statusLabel(snapshot: RoomSnapshot, t: Texts): { text: string; tone: 'idle' | 'live' | 'warn' | 'result' } {
  if (snapshot.paused) {
    return snapshot.pauseReason === 'hostDisconnected' ? { text: t.statusHostDisconnected, tone: 'warn' } : { text: t.statusPaused, tone: 'warn' };
  }
  switch (snapshot.phase) {
    case 'LOBBY':
      return { text: t.statusLobby, tone: 'idle' };
    case 'COUNTDOWN':
      return { text: t.statusCountdown, tone: 'idle' };
    case 'PLAYING':
      return { text: t.statusPlaying, tone: 'live' };
    case 'GAME_OVER':
      return { text: t.statusOver, tone: 'result' };
  }
}

export function seconds(ms: number | null): string {
  return ms === null ? '' : String(Math.ceil(ms / 1000));
}
