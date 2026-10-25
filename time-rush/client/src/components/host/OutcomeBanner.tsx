import type { RoomSnapshot, TeamId } from '@shared/types/game';
import { useT } from '../../i18n';

/** Large result text over a team's corridor while its runner passes or crashes. */
export function OutcomeBanner({ team, snapshot }: { team: TeamId; snapshot: RoomSnapshot }) {
  const t = useT();
  const state = snapshot.teams[team];
  const result = state.phase === 'ANIMATING' && state.lastResult?.roundId === state.roundId ? state.lastResult : null;
  if (!result) return null;
  const text = result.outcome === 'correct' ? t.outcomeCorrect(result.pointsAwarded) : result.outcome === 'wrong' ? t.outcomeWrong : t.outcomeSkipped;
  return (
    <div className={`outcome-banner team-${team} outcome-${result.outcome}`} key={result.roundId}>
      <div className="outcome-text">{text}</div>
      {result.decidedBy === 'random' && <div className="outcome-sub">{t.tieRandom}</div>}
      {result.decidedBy === 'tieBreak' && <div className="outcome-sub">{t.tieBreakDecided}</div>}
    </div>
  );
}
