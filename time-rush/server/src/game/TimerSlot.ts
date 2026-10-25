import type { Scheduler, TimerHandle } from './scheduler';

/**
 * One pausable timer. Scheduling replaces the previous action, and a cancelled or replaced timer
 * can never run (each schedule gets a fresh token), which keeps phase changes idempotent.
 */
export class TimerSlot {
  private handle: TimerHandle | null = null;
  private token = 0;
  private action: (() => void) | null = null;
  private endsAtMs: number | null = null;
  private durationMs: number | null = null;
  private pausedRemaining: number | null = null;

  constructor(private readonly scheduler: Scheduler) {}

  schedule(ms: number, action: () => void): void {
    this.clear();
    const token = ++this.token;
    this.action = action;
    this.durationMs = ms;
    this.endsAtMs = this.scheduler.now() + ms;
    this.handle = this.scheduler.setTimeout(() => {
      if (token !== this.token) return;
      this.handle = null;
      this.action = null;
      this.endsAtMs = null;
      action();
    }, ms);
  }

  clear(): void {
    if (this.handle) this.scheduler.clearTimeout(this.handle);
    this.handle = null;
    this.action = null;
    this.endsAtMs = null;
    this.durationMs = null;
    this.pausedRemaining = null;
    this.token++;
  }

  pause(): void {
    if (!this.handle || this.endsAtMs === null || !this.action) return;
    const remaining = Math.max(0, this.endsAtMs - this.scheduler.now());
    const action = this.action;
    const duration = this.durationMs;
    this.clear();
    this.action = action;
    this.durationMs = duration;
    this.pausedRemaining = remaining;
  }

  resume(): void {
    if (this.pausedRemaining === null || !this.action) return;
    const action = this.action;
    const remaining = this.pausedRemaining;
    const duration = this.durationMs;
    this.schedule(remaining, action);
    this.durationMs = duration; // keep the original length for progress bars
  }

  get endsAt(): number | null {
    return this.endsAtMs;
  }

  get duration(): number | null {
    return this.durationMs;
  }

  get remainingWhilePaused(): number | null {
    return this.pausedRemaining;
  }
}
