import type { RoomSnapshot } from '@shared/types/game';
import { useT, type Lang } from '../../i18n';
import { LangSwitch } from '../LangSwitch';
import { FullscreenButton } from './FullscreenButton';

interface Props {
  snapshot: RoomSnapshot;
  qr: string | null;
  joinUrl: string;
  joinUrlIsPublic: boolean;
  onStart: () => void;
  onRemove: (participantId: string) => void;
  busy: boolean;
  onLang: (lang: Lang) => void;
}

/** Join screen before the game: QR, room code and the list of players. Teams are drawn at random on START. */
export function LobbyOverlay({ snapshot, qr, joinUrl, joinUrlIsPublic, onStart, onRemove, busy, onLang }: Props) {
  const t = useT();
  const players = snapshot.participants;
  return (
    <div className="lobby">
      <section className="lobby-join">
        <h1 className="lobby-logo">TIME RUSH</h1>
        <p className="lobby-tagline">{t.lobbyTagline(snapshot.totalRounds)}</p>
        <div className="lobby-lang">
          <FullscreenButton />
          <LangSwitch onChange={onLang} />
        </div>
        <div className="lobby-qr">{qr ? <img src={qr} alt={`QR code: ${joinUrl}`} /> : <div className="qr-placeholder" />}</div>
        <div className="lobby-scan">{t.scanToJoin}</div>
        <div className="lobby-code">
          {t.roomCodeColon} <b className="mono">{snapshot.code}</b>
        </div>
        <div className="lobby-url mono">{joinUrl}</div>
        {!joinUrlIsPublic && (
          <div className="dev-warning">{t.devWarning}</div>
        )}
      </section>

      <section className="lobby-players">
        <header>
          <span>{t.playersCaps}</span>
          <b className="mono">{players.length}</b>
        </header>
        <ul>
          {players.map((p) => (
            <li key={p.id} className={p.connected ? '' : 'is-offline'}>
              <span>{p.nickname}</span>
              <button onClick={() => onRemove(p.id)} title={t.remove(p.nickname)} aria-label={t.remove(p.nickname)}>
                ×
              </button>
            </li>
          ))}
          {players.length === 0 && <li className="empty">{t.waitingFirst}</li>}
        </ul>
        <p className="lobby-note">
          {t.teamsRandom[0]}
          <b>{t.teamsRandom[1]}</b>
          {t.teamsRandom[2]}
        </p>
        <button className="start-btn" onClick={onStart} disabled={busy || players.length === 0}>
          {t.startGame}
        </button>
      </section>
    </div>
  );
}
