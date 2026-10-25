import { TEAM_IDS, teamWon, winnerOf, type RoomSnapshot, type TeamId } from '@shared/types/game';
import { SciFiCorridor, type EnvironmentView } from './EnvironmentView';
import { RunnerController } from './RunnerController';
import { GltfRunnerView, loadRunnerAssets } from './runnerAssets';
import { SceneManager } from './SceneManager';

/** One team's half of the screen: its own canvas, corridor, doors and runner. */
class TeamWorld {
  readonly scene: SceneManager;
  readonly runner: RunnerController;
  private readonly environment: EnvironmentView;
  snapshot: RoomSnapshot | null = null;
  clockOffset = 0;

  constructor(
    container: HTMLElement,
    private readonly team: TeamId,
  ) {
    this.scene = new SceneManager(container);
    this.environment = new SciFiCorridor(team);
    this.runner = new RunnerController(team);
    this.scene.scene.add(this.environment.root, this.runner.root);
    this.scene.onFrame((dt) => {
      const snapshot = this.snapshot;
      if (snapshot?.paused) return;
      const winner = snapshot?.phase === 'GAME_OVER' ? winnerOf(snapshot) : undefined;
      const ended = winner === undefined ? null : teamWon(winner, this.team) ? 'won' : 'lost';
      this.runner.update(dt, snapshot?.teams[this.team] ?? null, Date.now() + this.clockOffset, ended);
      this.scene.followZ = this.runner.z;
      this.scene.showcase = snapshot?.teams[this.team].phase === 'FINISHED';
      this.environment.update(this.scene.cameraPositionZ, this.scene.lookDirection);
      if (this.runner.impact > 0.95) this.scene.shake = 1;
    });
    this.scene.start();
  }

  dispose(): void {
    this.scene.dispose();
  }
}

/**
 * Facade used by React: two team worlds side by side. Each frame they read the latest authoritative
 * snapshot and the server clock; nothing here talks to the network.
 */
export class GameWorld {
  private readonly worlds: Record<TeamId, TeamWorld>;
  private disposed = false;

  constructor(containers: Record<TeamId, HTMLElement>) {
    this.worlds = { A: new TeamWorld(containers.A, 'A'), B: new TeamWorld(containers.B, 'B') };
    // Swap in the custom character as soon as it is available (models/runner.json).
    void loadRunnerAssets()
      .then((assets) => {
        if (!assets || this.disposed) return;
        for (const team of TEAM_IDS) this.worlds[team].runner.setView(new GltfRunnerView(team, assets));
        console.info('[time-rush] Custom runner model loaded.');
      })
      .catch((error: unknown) => console.warn('[time-rush] Custom runner could not be loaded, using the built-in one.', error));
  }

  sync(snapshot: RoomSnapshot, clockOffset: number): void {
    for (const team of TEAM_IDS) {
      this.worlds[team].snapshot = snapshot;
      this.worlds[team].clockOffset = clockOffset;
    }
  }

  dispose(): void {
    this.disposed = true;
    for (const team of TEAM_IDS) this.worlds[team].dispose();
  }
}
