import { GAME_CONFIG } from '@shared/config';
import type { RoomSnapshot, TeamId } from '@shared/types/game';
import { localizeQuestion, localizeResult, useLang, useT } from '../../i18n';
import { remainingMs } from '../../net/useRoom';
import { seconds } from './labels';

interface Props {
  team: TeamId;
  snapshot: RoomSnapshot;
  serverNow: number;
}

/** The team's own question at the top of its half, with its own 60-second timer and live votes. */
export function TeamQuestion({ team, snapshot, serverNow }: Props) {
  const t = useT();
  const lang = useLang();
  const state = snapshot.teams[team];
  const door = t.door(Math.max(0, state.roundIndex) + 1, snapshot.totalRounds);

  if (state.phase === 'FINISHED') {
    return (
      <section className={`team-question team-${team} is-compact`}>
        <div className="tq-finished">
          {t.finishedRank(state.finishRank)[0]}
          <b>{t.finishedRank(state.finishRank)[1]}</b>
        </div>
      </section>
    );
  }
  if (state.phase === 'WAITING' || state.phase === 'RUNNING' || !state.question) {
    return (
      <section className={`team-question team-${team} is-compact`}>
        <div className="tq-running">
          <span className="tq-dot" />
          {state.phase === 'RUNNING' ? t.runningTo(door) : t.ready}
        </div>
      </section>
    );
  }

  const question = localizeQuestion(state.question, lang);
  const left = remainingMs(state.phaseEndsAt, state.pausedRemainingMs, serverNow);
  const voting = state.phase === 'VOTING' || state.phase === 'TIE_BREAK';
  const total = state.phase === 'TIE_BREAK' ? GAME_CONFIG.tieBreakMs : GAME_CONFIG.votingMs;
  const result = state.phase === 'ANIMATING' && state.lastResult?.roundId === state.roundId ? localizeResult(state.lastResult, lang) : null;
  const votes = state.tally.A + state.tally.B + state.tally.C;
  const urgent = voting && left !== null && left <= 5000;

  return (
    <section className={`team-question team-${team}`}>
      <header className="tq-head">
        <span className="tq-door">{door}</span>
        {voting && <span className="tq-label">{state.phase === 'TIE_BREAK' ? t.tieVoteAgain : t.chooseDoor}</span>}
        {voting && <span className={`tq-timer ${urgent ? 'is-urgent' : ''}`}>{seconds(left).padStart(2, '0')}</span>}
      </header>
      <h2 className="tq-text">{question.question}</h2>
      <ol className="tq-answers">
        {question.answers.map((answer) => {
          const share = votes ? state.tally[answer.id] / votes : 0;
          const isCorrect = result?.correctAnswer === answer.id;
          const isWrong = result && result.selectedAnswer === answer.id && !isCorrect;
          const dim = (state.tieBreak && !state.tieBreak.includes(answer.id)) || (result && !isCorrect && !isWrong);
          return (
            <li key={answer.id} className={`tq-answer ${isCorrect ? 'is-correct' : ''} ${isWrong ? 'is-wrong' : ''} ${dim ? 'is-dim' : ''}`}>
              <span className="tq-fill" style={{ transform: `scaleX(${result ? 0 : share})` }} />
              <span className="answer-key">{answer.id}</span>
              <span className="tq-answer-text">{answer.text}</span>
              <span className="tq-count">{state.tally[answer.id]}</span>
            </li>
          );
        })}
      </ol>
      {voting && (
        <footer className="tq-foot">
          <div className="tq-bar">
            <span style={{ transform: `scaleX(${left === null ? 0 : Math.min(1, left / total)})` }} />
          </div>
          <span>
            {t.voted(state.votedCount, state.connectedCount)}
          </span>
        </footer>
      )}
      {result && <p className="tq-explain">{result.explanation}</p>}
    </section>
  );
}

/** "3, 2, 1, GO!" before both runners start. */
export function StartCountdown({ snapshot, serverNow }: { snapshot: RoomSnapshot; serverNow: number }) {
  const t = useT();
  if (snapshot.phase !== 'COUNTDOWN') return null;
  const left = remainingMs(snapshot.phaseEndsAt, snapshot.pausedRemainingMs, serverNow) ?? 0;
  const value = Math.ceil(left / 1000) - 1;
  const label = value >= 1 ? String(value) : t.go;
  return (
    <div className="start-countdown" key={label}>
      <span>{label}</span>
    </div>
  );
}
