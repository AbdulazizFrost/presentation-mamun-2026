import type { AnswerId, RoomSnapshot, TeamId } from '@shared/types/game';
import { localizeQuestion, useLang, useT } from '../../i18n';

interface Props {
  snapshot: RoomSnapshot;
  team: TeamId;
  myVote: AnswerId | null;
  sending: boolean;
  remainingSeconds: string;
  error: string | null;
  onVote: (answer: AnswerId) => void;
}

/** Three large answer buttons for the team's own question. The vote can change until voting closes. */
export function VoteScreen({ snapshot, team, myVote, sending, remainingSeconds, error, onVote }: Props) {
  const t = useT();
  const lang = useLang();
  const state = snapshot.teams[team];
  if (!state.question) return null;
  const question = localizeQuestion(state.question, lang);
  const tie = state.tieBreak;
  const tally = state.tally;

  return (
    <section className="screen vote">
      <div className="vote-head">
        <span className="mobile-label">
          {t.door(state.roundIndex + 1, snapshot.totalRounds)}
        </span>
        <span className={`timer ${Number(remainingSeconds) <= 5 ? 'is-low' : ''}`}>{remainingSeconds}</span>
      </div>
      {tie && <div className="tie-note">{t.tieNote}</div>}
      <h2 className="vote-question">{question.question}</h2>
      <div className="vote-buttons">
        {question.answers.map((answer) => {
          const disabled = tie !== null && !tie.includes(answer.id);
          const selected = myVote === answer.id;
          return (
            <button
              key={answer.id}
              className={`vote-btn ${selected ? 'is-selected' : ''}`}
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onVote(answer.id)}
            >
              <span className="vote-btn-letter">{answer.id}</span>
              <span className="vote-btn-text">{answer.text}</span>
              <span className="vote-btn-count" title={t.votesInTeam}>
                {tally[answer.id]}
              </span>
            </button>
          );
        })}
      </div>
      <p className={`vote-status ${error ? 'is-error' : ''}`}>
        {error ?? (sending ? t.sending : myVote ? t.yourVote(myVote) : t.tapToVote)}
      </p>
      <p className="mobile-muted small">
        {t.teammatesVoted(state.votedCount, state.connectedCount)}
      </p>
    </section>
  );
}
