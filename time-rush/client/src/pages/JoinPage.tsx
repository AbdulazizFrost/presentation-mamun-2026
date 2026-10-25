import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { ErrorCode, ParticipantSession } from '@shared/protocol/events';
import { normalizeRoomCode } from '@shared/protocol/validate';
import type { AnswerId, TeamId } from '@shared/types/game';
import { seconds } from '../components/host/labels';
import { FinishedScreen, LobbyScreen, ResultScreen, RunningScreen, TeamFinishedScreen } from '../components/mobile/StatusScreens';
import { VoteScreen } from '../components/mobile/VoteScreen';
import { participantStore } from '../net/sessionStore';
import { request, type GameSocket } from '../net/socket';
import { remainingMs, useRoom, useServerNow } from '../net/useRoom';
import { errorText, setLang, useT } from '../i18n';
import '../styles/mobile.css';

type Me = Omit<ParticipantSession, 'snapshot'>;

/** Phone voting remote: join, wait for the random team draw, vote. Never renders the 3D world. */
export function JoinPage() {
  const t = useT();
  const roomCode = normalizeRoomCode(new URLSearchParams(window.location.search).get('room'));
  const [codeInput, setCodeInput] = useState('');
  const [nickname, setNickname] = useState(() => participantStore.lastNickname());
  const [me, setMe] = useState<Me | null>(null);
  const [myVote, setMyVote] = useState<{ roundId: string; answer: AnswerId } | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(() => (roomCode ? participantStore.get(roomCode) !== null : false));
  const meRef = useRef<Me | null>(null);

  const adopt = useCallback((session: ParticipantSession, setSnapshot: (s: ParticipantSession['snapshot']) => void) => {
    const { snapshot, ...info } = session;
    meRef.current = info;
    setMe(info);
    setMyVote(info.currentVote);
    setSnapshot(snapshot);
    participantStore.set(info.code, { code: info.code, sessionToken: info.sessionToken, nickname: info.nickname });
    participantStore.rememberNickname(info.nickname);
  }, []);

  const failJoin = (code: string, message: string) => {
    if (code === 'ROOM_NOT_FOUND') {
      if (roomCode) participantStore.set(roomCode, null);
      setFatal(t.joinNotFound);
    } else if (code === 'GAME_IN_PROGRESS') {
      if (roomCode) participantStore.set(roomCode, null);
      setFatal(t.joinInProgress);
    } else setError(errorText(t, code as ErrorCode, message));
  };

  const room = useRoom({
    onConnect: (socket: GameSocket) => {
      if (!roomCode) return;
      const stored = meRef.current ?? participantStore.get(roomCode);
      if (!stored) return;
      // Reconnect with the saved session: same participant, same team, same vote.
      void request(socket, 'room:join', { code: roomCode, nickname: stored.nickname, sessionToken: stored.sessionToken }).then((res) => {
        setRestoring(false);
        if (res.ok) adopt(res.data, room.setSnapshot);
        else failJoin(res.error, res.message);
      });
    },
    onRemoved: () => {
      if (roomCode) participantStore.set(roomCode, null);
      meRef.current = null;
      setMe(null);
      setFatal(t.removedByHost);
    },
    onRoomGone: (message) => setFatal(message),
  });
  const { snapshot, socket, status, clockOffset } = room;
  const serverNow = useServerNow(clockOffset);

  // Teams are drawn by the server at the start: read ours from the latest snapshot.
  const team: TeamId | null = (me && snapshot?.participants.find((p) => p.id === me.participantId)?.team) ?? null;
  const teamState = team && snapshot ? snapshot.teams[team] : null;

  // The host chooses the language for everyone.
  useEffect(() => {
    if (snapshot) setLang(snapshot.language);
  }, [snapshot?.language]);

  // A new door clears the local vote.
  useEffect(() => {
    if (teamState?.roundId && myVote && myVote.roundId !== teamState.roundId) setMyVote(null);
    setError(null);
  }, [teamState?.roundId]); // only when the door changes

  if (!roomCode) {
    const valid = normalizeRoomCode(codeInput);
    return (
      <main className="mobile">
        <Brand />
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) window.location.href = `/join?room=${valid}`;
          }}
        >
          <label className="field-label" htmlFor="code">{t.roomCode}</label>
          <input id="code" className="input input-code" value={codeInput} maxLength={5} autoCapitalize="characters" autoComplete="off"
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())} placeholder="ABCDE" />
          <button className="btn btn-primary btn-block" disabled={!valid}>{t.next}</button>
        </form>
      </main>
    );
  }

  const header = (
    <header className="mobile-top">
      <Brand small />
      <span className="room-chip">{roomCode}</span>
      {team && <span className={`team-chip team-${team}`}>{t.team(team)}</span>}
      <span className={`conn-dot conn-${status}`} title={status} />
    </header>
  );

  if (fatal) {
    return (
      <main className="mobile">
        {header}
        <section className="screen center">
          <h2>{t.cantJoin}</h2>
          <p className="mobile-muted">{fatal}</p>
          <a className="btn btn-ghost" href="/">{t.otherCode}</a>
        </section>
      </main>
    );
  }

  const join = async () => {
    setSending(true);
    setError(null);
    const res = await request(socket, 'room:join', { code: roomCode, nickname });
    setSending(false);
    if (res.ok) adopt(res.data, room.setSnapshot);
    else failJoin(res.error, res.message);
  };

  const vote = async (answer: AnswerId) => {
    const roundId = teamState?.roundId;
    if (!roundId) return;
    const previous = myVote;
    setMyVote({ roundId, answer });
    setSending(true);
    setError(null);
    const res = await request(socket, 'vote:submit', { roundId, answer });
    setSending(false);
    if (!res.ok) {
      setMyVote(previous);
      setError(errorText(t, res.error, res.message));
    }
  };

  let body: ReactNode;
  if (status !== 'connected' && !snapshot) {
    body = <Notice title={t.connecting} text={t.lookingServer} />;
  } else if (restoring) {
    body = <Notice title={t.reconnecting} text={t.restoringVote} />;
  } else if (!me) {
    body = (
      <form className="stack" onSubmit={(e) => { e.preventDefault(); void join(); }}>
        <label className="field-label" htmlFor="nick">{t.yourName}</label>
        <input id="nick" className="input" value={nickname} maxLength={20} autoComplete="nickname"
          onChange={(e) => setNickname(e.target.value)} placeholder={t.namePlaceholder} />
        <button className="btn btn-primary btn-block" disabled={sending || nickname.trim().length === 0}>{t.joinRoom(roomCode)}</button>
        {error && <p className="form-error">{error}</p>}
      </form>
    );
  } else if (!snapshot) {
    body = <Notice title={t.loadingShort} text="" />;
  } else if (snapshot.phase === 'LOBBY' || !team) {
    body = <LobbyScreen snapshot={snapshot} nickname={me.nickname} />;
  } else if (snapshot.phase === 'GAME_OVER') {
    body = <FinishedScreen snapshot={snapshot} team={team} />;
  } else if (!teamState || snapshot.phase === 'COUNTDOWN') {
    body = <RunningScreen snapshot={snapshot} team={team} first />;
  } else if (teamState.phase === 'VOTING' || teamState.phase === 'TIE_BREAK') {
    body = (
      <VoteScreen
        snapshot={snapshot}
        team={team}
        myVote={myVote && myVote.roundId === teamState.roundId ? myVote.answer : null}
        sending={sending}
        remainingSeconds={seconds(remainingMs(teamState.phaseEndsAt, teamState.pausedRemainingMs, serverNow))}
        error={error}
        onVote={(a) => void vote(a)}
      />
    );
  } else if (teamState.phase === 'ANIMATING') {
    body = <ResultScreen snapshot={snapshot} team={team} />;
  } else if (teamState.phase === 'FINISHED') {
    body = <TeamFinishedScreen snapshot={snapshot} team={team} />;
  } else {
    body = <RunningScreen snapshot={snapshot} team={team} first={teamState.roundIndex <= 0} />;
  }

  return (
    <main className={`mobile ${team ? `team-${team} has-team` : ''}`}>
      {header}
      {status === 'reconnecting' && <div className="reconnect-bar">{t.connectionLost}</div>}
      {snapshot?.paused && me && <div className="paused-bar">{snapshot.pauseReason === 'hostDisconnected' ? t.waitingHost : t.gamePaused}</div>}
      {body}
    </main>
  );
}

function Brand({ small = false }: { small?: boolean }) {
  return <div className={`mobile-brand ${small ? 'is-small' : ''}`}>TIME RUSH</div>;
}

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <section className="screen center">
      <div className="spinner" aria-hidden />
      <h2>{title}</h2>
      {text && <p className="mobile-muted">{text}</p>}
    </section>
  );
}
