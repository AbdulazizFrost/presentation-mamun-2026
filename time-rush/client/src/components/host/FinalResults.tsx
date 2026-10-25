import { TEAM_IDS, teamWon, winnerOf, type RoomSnapshot } from '@shared/types/game';
import { useT } from '../../i18n';

interface Props {
  snapshot: RoomSnapshot;
  onRestart: () => void;
  busy: boolean;
}

/**
 * Final screen laid over the 3D view: the result on top, each team's result under its own runner
 * (the cameras show the runners from the front), and PLAY AGAIN in the middle.
 * More correct answers wins; the same number means both teams win (or nobody, with none correct).
 */
export function FinalResults({ snapshot, onRestart, busy }: Props) {
  const t = useT();
  const winner = winnerOf(snapshot);
  const title = winner === 'both' ? t.bothWin : winner === 'none' ? t.nobodyWins : t.teamWins(winner);
  return (
    <div className="final">
      <div className="final-head">
        <div className="final-label">{t.finalResults}</div>
        <h1 className={`final-title ${winner === 'A' || winner === 'B' ? `team-${winner}` : ''}`}>{title}</h1>
        {winner === 'both' && <div className="final-note">{t.bothWinNote}</div>}
        {winner === 'none' && <div className="final-note">{t.nobodyNote}</div>}
      </div>
      {TEAM_IDS.map((team) => {
        const state = snapshot.teams[team];
        const isWinner = teamWon(winner, team);
        return (
          <div key={team} className={`final-team team-${team} ${isWinner ? 'is-winner' : ''}`}>
            {isWinner && <span className="final-crown">{t.winner}</span>}
            <span className="final-team-name">{t.team(team)}</span>
            <span className="final-score mono">{state.score}</span>
            <span className="final-correct">{t.correctOf(state.correctCount, snapshot.totalRounds, state.finishRank)}</span>
          </div>
        );
      })}
      <div className="final-actions">
        <p className="final-message">{t.finalMessage}</p>
        <button className="start-btn" onClick={onRestart} disabled={busy}>
          {t.playAgain}
        </button>
      </div>
    </div>
  );
}
