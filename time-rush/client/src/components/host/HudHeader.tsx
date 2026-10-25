import { TEAM_IDS, type RoomSnapshot } from '@shared/types/game';
import { useT } from '../../i18n';

/** Top band: Team A panel (score, correct, door), the TIME RUSH title, Team B panel. */
export function HudHeader({ snapshot }: { snapshot: RoomSnapshot }) {
  const t = useT();
  return (
    <header className="hud-header">
      {TEAM_IDS.map((team) => {
        const state = snapshot.teams[team];
        const door = state.phase === 'FINISHED' ? t.finishedCaps : t.door(Math.max(0, state.roundIndex) + 1, snapshot.totalRounds);
        return (
          <div key={team} className={`team-banner team-${team}`}>
            <div className="team-banner-top">
              <span className="team-banner-name">{t.team(team)}</span>
              <span className="team-banner-door">{door}</span>
            </div>
            <div className="team-banner-stats">
              <span>
                {t.score}: <b className="mono">{state.score}</b>
              </span>
              <span>
                {t.correctCaps}: <b className="mono">{state.correctCount}</b>
              </span>
            </div>
          </div>
        );
      })}
      <div className="hud-title">
        <h1>TIME RUSH</h1>
        <div className="round-tab">{t.raceDoors(snapshot.totalRounds)}</div>
      </div>
    </header>
  );
}
