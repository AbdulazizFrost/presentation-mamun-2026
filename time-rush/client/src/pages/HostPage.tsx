import { useCallback, useEffect, useRef, useState } from 'react';
import type { HostSession, Result } from '@shared/protocol/events';
import { TEAM_IDS } from '@shared/types/game';
import { BottomBar } from '../components/host/BottomBar';
import { FinalResults } from '../components/host/FinalResults';
import { HudHeader } from '../components/host/HudHeader';
import { LobbyOverlay } from '../components/host/LobbyOverlay';
import { useQrCode } from '../components/host/useQrCode';
import { StartCountdown, TeamQuestion } from '../components/host/TeamQuestion';
import { OutcomeBanner } from '../components/host/OutcomeBanner';
import { GameCanvas } from '../game/GameCanvas';
import { hostStore } from '../net/sessionStore';
import { request, type GameSocket } from '../net/socket';
import { useRoom, useServerNow } from '../net/useRoom';
import { useGameAudio } from '../audio/useGameAudio';
import { FullscreenButton, toggleFullscreen } from '../components/host/FullscreenButton';
import { LangSwitch } from '../components/LangSwitch';
import { errorText, getLang, setLang, useLang, useT, type Lang, type Texts } from '../i18n';
import '../styles/host.css';

type HostInfo = Omit<HostSession, 'snapshot'>;

/** Projector screen: two 3D corridors, the HUD and the host controls. */
export function HostPage() {
  const t = useT();
  const [host, setHost] = useState<HostInfo | null>(null);
  // A notice is either a text or picked from the current language, so it follows the UZ/EN switch.
  const [notice, setNotice] = useState<string | ((t: Texts) => string) | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(() => hostStore.get() !== null);
  const hostRef = useRef<HostInfo | null>(null);

  const adopt = useCallback((session: HostSession, setSnapshot: (s: HostSession['snapshot']) => void) => {
    const { snapshot, ...info } = session;
    hostRef.current = info;
    setHost(info);
    setSnapshot(snapshot);
    hostStore.set({ code: info.code, hostToken: info.hostToken });
    setLang(snapshot.language);
  }, []);

  const forget = (message: string | ((t: Texts) => string)) => {
    hostStore.set(null);
    hostRef.current = null;
    setHost(null);
    setNotice(() => message);
  };

  const room = useRoom({
    onConnect: (socket: GameSocket) => {
      const stored = hostRef.current ?? hostStore.get();
      if (!stored) return;
      void request(socket, 'host:resume', { code: stored.code, hostToken: stored.hostToken }).then((res) => {
        setCheckingSession(false);
        if (res.ok) {
          adopt(res.data, room.setSnapshot);
          setNotice(null);
        } else {
          forget(
            res.error === 'ROOM_NOT_FOUND' ? (l) => l.roomGone : (l) => errorText(l, res.error, res.message),
          );
        }
      });
    },
    onRoomGone: forget,
  });
  const { snapshot, socket, status, clockOffset } = room;
  const serverNow = useServerNow(clockOffset);
  useGameAudio(snapshot, serverNow);
  // F toggles fullscreen (not while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'f' || e.key === 'F') && !(e.target instanceof HTMLInputElement)) toggleFullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const lang = useLang();
  // Phones open the join link already in the game's language.
  const joinUrl = host ? `${host.joinUrl}${host.joinUrl.includes('?') ? '&' : '?'}lang=${lang}` : null;
  const qr = useQrCode(joinUrl);

  /** The host's choice becomes the language of the whole room. */
  const chooseLang = (next: Lang) => {
    setLang(next);
    if (hostRef.current) void request(socket, 'host:setLanguage', { language: next });
  };

  const run = async (action: () => Promise<Result<unknown>>) => {
    setBusy(true);
    const res = await action();
    setBusy(false);
    if (!res.ok) setNotice(() => (l: Texts) => errorText(l, res.error, res.message));
  };

  const createRoom = () =>
    run(async () => {
      const preferred = getLang();
      const res = await request(socket, 'room:create');
      if (res.ok) {
        adopt(res.data, room.setSnapshot);
        chooseLang(preferred);
        setNotice(null);
      }
      return res;
    });

  if (!host || !snapshot) {
    return (
      <div className="host-start">
        <div className="is-corner">
          <FullscreenButton />
          <LangSwitch onChange={chooseLang} />
        </div>
        <h1 className="lobby-logo">TIME RUSH</h1>
        <p className="lobby-tagline">{t.hostTagline}</p>
        {notice && <p className="notice">{typeof notice === 'function' ? notice(t) : notice}</p>}
        <button className="start-btn" onClick={createRoom} disabled={busy || status !== 'connected' || checkingSession}>
          {status !== 'connected' ? t.connectingCaps : checkingSession ? t.restoringCaps : t.createRoom}
        </button>
      </div>
    );
  }

  const inGame = snapshot.phase === 'COUNTDOWN' || snapshot.phase === 'PLAYING';
  return (
    <div className="host">
      <GameCanvas snapshot={snapshot} clockOffset={clockOffset} />
      <div className="hud">
        <HudHeader snapshot={snapshot} />
        {inGame && (
          <>
            {TEAM_IDS.map((team) => (
              <TeamQuestion key={`q${team}`} team={team} snapshot={snapshot} serverNow={serverNow} />
            ))}
            {TEAM_IDS.map((team) => (
              <OutcomeBanner key={`o${team}`} team={team} snapshot={snapshot} />
            ))}
            <StartCountdown snapshot={snapshot} serverNow={serverNow} />
          </>
        )}
        <BottomBar
          snapshot={snapshot}
          connection={status}
          onLang={chooseLang}
          busy={busy}
          onPause={() => run(() => request(socket, 'game:pause'))}
          onResume={() => run(() => request(socket, 'game:resume'))}
          onRestart={() => run(() => request(socket, 'game:restart'))}
        />
        {snapshot.paused && (
          <div className="paused-banner">
            {snapshot.pauseReason === 'hostDisconnected' ? t.hostBackPaused : t.pausedCaps}
          </div>
        )}
        {notice && (
          <button className="notice notice-floating" onClick={() => setNotice(null)}>
            {typeof notice === 'function' ? notice(t) : notice} ✕
          </button>
        )}
      </div>
      {snapshot.phase === 'LOBBY' && (
        <LobbyOverlay
          snapshot={snapshot}
          qr={qr}
          joinUrl={joinUrl ?? host.joinUrl}
          onLang={chooseLang}
          joinUrlIsPublic={host.joinUrlIsPublic}
          busy={busy}
          onStart={() => run(() => request(socket, 'game:start'))}
          onRemove={(participantId) => run(() => request(socket, 'host:removeParticipant', { participantId }))}
        />
      )}
      {snapshot.phase === 'GAME_OVER' && (
        <FinalResults snapshot={snapshot} busy={busy} onRestart={() => run(() => request(socket, 'game:restart'))} />
      )}
    </div>
  );
}
