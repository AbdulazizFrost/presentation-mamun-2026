import { useEffect, useRef, useSyncExternalStore } from 'react';
import { GAME_CONFIG } from '@shared/config';
import { TEAM_IDS, winnerOf, type RoomSnapshot } from '@shared/types/game';
import { remainingMs } from '../net/useRoom';
import { gameAudio } from './GameAudio';

/** Seconds into a crash when the runner hits the door (RunnerController: hit = 0.25). */
const CRASH_HIT_S = (GAME_CONFIG.crashMs * 0.25) / 1000;

/** Turns snapshot changes on the projector into music and sound effects. */
export function useGameAudio(snapshot: RoomSnapshot | null, serverNow: number): void {
  const seen = useRef({ countdown: -1, results: new Set<string>(), ticks: '', votes: 0, over: false });

  // Sound needs a user gesture: the first click on the page unlocks it.
  useEffect(() => {
    const unlock = () => gameAudio.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const phase = snapshot?.phase ?? null;
  const paused = snapshot?.paused ?? false;
  useEffect(() => {
    if (phase === 'COUNTDOWN' || phase === 'PLAYING') gameAudio.setMusic(paused ? 'off' : 'race');
    else if (phase === 'LOBBY') gameAudio.setMusic('lobby');
    else gameAudio.setMusic('off');
  }, [phase, paused]);

  useEffect(() => {
    if (!snapshot || snapshot.paused) return;
    const s = seen.current;

    // 3, 2, 1 … GO!
    if (snapshot.phase === 'COUNTDOWN') {
      const left = remainingMs(snapshot.phaseEndsAt, snapshot.pausedRemainingMs, serverNow) ?? 0;
      const value = Math.max(0, Math.ceil(left / 1000) - 1);
      if (value !== s.countdown) {
        s.countdown = value;
        gameAudio.play(value >= 1 ? 'beep' : 'go');
      }
    } else s.countdown = -1;

    // Each result once: a door opening or a crash into it.
    for (const team of TEAM_IDS) {
      const result = snapshot.teams[team].lastResult;
      if (!result || s.results.has(result.roundId)) continue;
      s.results.add(result.roundId);
      if (snapshot.teams[team].phase !== 'ANIMATING') continue; // old result after a reload
      if (result.outcome === 'correct') {
        gameAudio.play('correct');
        gameAudio.play('door', 0.25);
      } else gameAudio.play('wrong', CRASH_HIT_S);
    }

    // Last five seconds of voting: one tick per second.
    let tick = '';
    for (const team of TEAM_IDS) {
      const state = snapshot.teams[team];
      if (state.phase !== 'VOTING' && state.phase !== 'TIE_BREAK') continue;
      const secs = Math.ceil((remainingMs(state.phaseEndsAt, state.pausedRemainingMs, serverNow) ?? 0) / 1000);
      if (secs >= 1 && secs <= 5) tick = `${state.roundId}:${secs}`;
    }
    if (tick && tick !== s.ticks) gameAudio.play('tick');
    s.ticks = tick;

    // A soft blip for every new vote.
    const votes = TEAM_IDS.reduce((sum, team) => sum + snapshot.teams[team].votedCount, 0);
    if (votes > s.votes) gameAudio.play('vote');
    s.votes = votes;

    // Fanfare at the end, or a sad trombone when nobody won.
    if (snapshot.phase === 'GAME_OVER' && !s.over) gameAudio.play(winnerOf(snapshot) === 'none' ? 'lose' : 'win', 0.3);
    s.over = snapshot.phase === 'GAME_OVER';
    if (snapshot.phase === 'LOBBY') s.results.clear();
  }, [snapshot, serverNow]);
}

/** Mute state for the speaker button. */
export function useMuted(): [boolean, (muted: boolean) => void] {
  const muted = useSyncExternalStore((l) => gameAudio.subscribe(l), () => gameAudio.muted);
  return [muted, (m) => gameAudio.setMuted(m)];
}
