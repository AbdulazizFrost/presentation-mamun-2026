import { useState } from 'react';
import type { RoomSnapshot } from '@shared/types/game';
import type { ConnectionStatus } from '../../net/useRoom';
import { useMuted } from '../../audio/useGameAudio';
import { useT, type Lang } from '../../i18n';
import { LangSwitch } from '../LangSwitch';
import { FullscreenButton } from './FullscreenButton';
import { statusLabel } from './labels';

interface Props {
  snapshot: RoomSnapshot;
  connection: ConnectionStatus;
  busy: boolean;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onLang: (lang: Lang) => void;
}

/** Bottom band: room code, players, connection and game status; the gear opens the host menu. */
export function BottomBar({ snapshot, connection, busy, onPause, onResume, onRestart, onLang }: Props) {
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const [muted, setMuted] = useMuted();
  const status = statusLabel(snapshot, t);
  const players = snapshot.participants.filter((p) => p.connected).length;
  const running = snapshot.phase !== 'LOBBY' && snapshot.phase !== 'GAME_OVER';

  return (
    <footer className="hud-bottom">
      <div className="bottom-item">
        {t.roomCodeColon} <b className="room-code mono">{snapshot.code}</b>
      </div>
      <div className="bottom-item">
        <svg viewBox="0 0 24 24" aria-hidden className="icon">
          <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20c0-3.3 3.1-6 7-6s7 2.7 7 6v1H2v-1Zm15.5 1v-1c0-1.6-.6-3.1-1.6-4.3 3.3.2 6.1 2.3 6.1 5V21h-4.5Z" />
        </svg>
        {t.playersConnected(players)}
      </div>
      <div className={`bottom-item conn conn-${connection}`}>
        <i />
        {connection === 'connected' ? t.connectedCaps : t.reconnectingCaps}
      </div>
      <div className="bottom-spacer" />
      <button className="sound-btn" onClick={() => setMuted(!muted)} aria-label={muted ? t.soundOn : t.soundOff} title={muted ? t.soundOn : t.soundOff}>
        {muted ? '🔇' : '🔊'}
      </button>
      <FullscreenButton />
      <LangSwitch onChange={onLang} />
      <div className="bottom-status">
        <button className="gear" onClick={() => setMenuOpen((v) => !v)} aria-label={t.hostMenu} aria-expanded={menuOpen}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-1.7-1L15 3.5h-4l-.4 2.5a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 11a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7.4 7.4 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6ZM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
          </svg>
        </button>
        {t.gameStatus} <b className={`status-${status.tone}`}>{status.text}</b>
        {menuOpen && (
          <div className="host-menu" role="menu">
            {running &&
              (snapshot.paused ? (
                <button disabled={busy} onClick={() => { setMenuOpen(false); onResume(); }}>{t.resume}</button>
              ) : (
                <button disabled={busy} onClick={() => { setMenuOpen(false); onPause(); }}>{t.pause}</button>
              ))}
            <button
              disabled={busy}
              onClick={() => {
                setMenuOpen(false);
                if (window.confirm(t.restartConfirm)) onRestart();
              }}
            >
              {t.restart}
            </button>
          </div>
        )}
      </div>
    </footer>
  );
}
