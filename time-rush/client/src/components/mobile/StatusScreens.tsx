import { teamWon, winnerOf, type RoomSnapshot, type TeamId } from '@shared/types/game';
import { localizeResult, useLang, useT } from '../../i18n';

export function LobbyScreen({ snapshot, nickname }: { snapshot: RoomSnapshot; nickname: string }) {
  const t = useT();
  const [before, bold, after] = t.playersInRoom(snapshot.participants.length);
  return (
    <section className="screen center">
      <div className="you-badge">{nickname}</div>
      <h2>{t.youAreIn}</h2>
      <p className="mobile-muted">
        {before}
        <b>{bold}</b>
        {after}
      </p>
      <div className="pulse-dot" aria-hidden />
      <p className="mobile-muted small">{t.watchScreen}</p>
    </section>
  );
}

/** Start countdown and the runs between doors: no question yet, just get ready. */
export function RunningScreen({ snapshot, team, first }: { snapshot: RoomSnapshot; team: TeamId; first: boolean }) {
  const t = useT();
  const state = snapshot.teams[team];
  const door = Math.max(0, state.roundIndex) + 1;
  return (
    <section className="screen center">
      {first && (
        <div className={`team-reveal team-${team}`}>
          {t.youAreInTeam}
          <b>{t.team(team)}</b>
        </div>
      )}
      <div className="runner-anim" aria-hidden>
        🏃
      </div>
      <h2>{snapshot.phase === 'COUNTDOWN' ? t.getReady : t.runningToDoor(door)}</h2>
      <p className="mobile-muted">{t.doorOfScore(door, snapshot.totalRounds, state.score)}</p>
    </section>
  );
}

export function ResultScreen({ snapshot, team }: { snapshot: RoomSnapshot; team: TeamId }) {
  const t = useT();
  const lang = useLang();
  const last = snapshot.teams[team].lastResult;
  if (!last) return <section className="screen center">{t.waitingResults}</section>;
  const result = localizeResult(last, lang);
  return (
    <section className="screen center">
      <div className={`result-badge outcome-${result.outcome}`}>
        {result.outcome === 'correct' && t.correctBang}
        {result.outcome === 'wrong' && t.wrongDoor}
        {result.outcome === 'skipped' && t.outcomeSkipped}
      </div>
      <p className="mobile-muted">
        {t.teamChose} <b>{result.selectedAnswer ?? '—'}</b>
        {result.pointsAwarded > 0 && t.plusPoints(result.pointsAwarded)}
      </p>
      <div className="correct-answer">
        <span className="mobile-label">{t.correctAnswer}</span>
        <b>
          {result.correctAnswer}. {result.correctAnswerText}
        </b>
        <p>{result.explanation}</p>
      </div>
    </section>
  );
}

export function TeamFinishedScreen({ snapshot, team }: { snapshot: RoomSnapshot; team: TeamId }) {
  const t = useT();
  const state = snapshot.teams[team];
  return (
    <section className="screen center">
      <div className={`team-reveal team-${team}`}>
        {t.finishedCaps}
        <b>{t.rankBang(state.finishRank)}</b>
      </div>
      <h2>{t.pointsCorrect(state.score, state.correctCount)}</h2>
      <p className="mobile-muted">{t.waitingOther}</p>
      <div className="pulse-dot" aria-hidden />
    </section>
  );
}

export function FinishedScreen({ snapshot, team }: { snapshot: RoomSnapshot; team: TeamId | null }) {
  const t = useT();
  const { A, B } = snapshot.teams;
  const winner = winnerOf(snapshot);
  const title =
    winner === 'both' ? t.bothWon : winner === 'none' ? t.nobodyWon : team !== null && teamWon(winner, team) ? t.yourTeamWon : t.teamWon(winner);
  return (
    <section className="screen center">
      <span className="mobile-label">{t.finalResults}</span>
      <h2 className="final-mobile-title">{title}</h2>
      <div className="final-mobile-scores">
        <div className="team-A">
          <span>{t.team('A')}</span>
          <b className="mono">{A.score}</b>
          <small>{t.nCorrect(A.correctCount)}</small>
        </div>
        <div className="team-B">
          <span>{t.team('B')}</span>
          <b className="mono">{B.score}</b>
          <small>{t.nCorrect(B.correctCount)}</small>
        </div>
      </div>
      <p className="mobile-muted">{t.thanks}</p>
    </section>
  );
}
