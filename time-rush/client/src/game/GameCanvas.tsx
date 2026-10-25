import { useEffect, useRef } from 'react';
import type { RoomSnapshot } from '@shared/types/game';
import { GameWorld } from './GameWorld';

interface Props {
  snapshot: RoomSnapshot | null;
  /** Server clock minus local clock. */
  clockOffset: number;
}

/** Mounts the two team worlds (left: Team A, right: Team B) and hands them every new snapshot. */
export function GameCanvas({ snapshot, clockOffset }: Props) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<GameWorld | null>(null);
  const latest = useRef({ snapshot, clockOffset });
  latest.current = { snapshot, clockOffset };

  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;
    let world: GameWorld | null = null;
    let cancelled = false;
    // Door letters are drawn with the Exo 2 font: wait until it is loaded.
    void document.fonts.load('italic 900 64px "Exo 2"').finally(() => {
      if (cancelled) return;
      world = new GameWorld({ A: left, B: right });
      worldRef.current = world;
      if (latest.current.snapshot) world.sync(latest.current.snapshot, latest.current.clockOffset);
    });
    return () => {
      cancelled = true;
      world?.dispose();
      worldRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (snapshot) worldRef.current?.sync(snapshot, clockOffset);
  }, [snapshot, clockOffset]);

  return (
    <div className="game-canvas" aria-label="TIME RUSH game view">
      <div ref={leftRef} className="game-half game-half-a" />
      <div ref={rightRef} className="game-half game-half-b" />
    </div>
  );
}
