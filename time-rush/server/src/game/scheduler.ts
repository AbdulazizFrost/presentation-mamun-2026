// Clock and timer abstraction. The game never calls Date.now()/setTimeout directly,
// so tests can drive deadlines with a fake clock instead of real waiting.

export type TimerHandle = { readonly id: number };

export interface Scheduler {
  now(): number;
  setTimeout(callback: () => void, ms: number): TimerHandle;
  clearTimeout(handle: TimerHandle): void;
}

export class RealScheduler implements Scheduler {
  private nextId = 1;
  private readonly timers = new Map<number, NodeJS.Timeout>();

  now(): number {
    return Date.now();
  }

  setTimeout(callback: () => void, ms: number): TimerHandle {
    const id = this.nextId++;
    const timer = setTimeout(() => {
      this.timers.delete(id);
      callback();
    }, Math.max(0, ms));
    this.timers.set(id, timer);
    return { id };
  }

  clearTimeout(handle: TimerHandle): void {
    const timer = this.timers.get(handle.id);
    if (timer) clearTimeout(timer);
    this.timers.delete(handle.id);
  }
}
