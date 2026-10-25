import type { Scheduler } from '../game/scheduler';

export interface BucketConfig {
  capacity: number;
  refillPerSecond: number;
}

/** Simple token bucket: `capacity` actions in a burst, refilled at `refillPerSecond`. */
export class TokenBucket {
  private tokens: number;
  private updatedAt: number;

  constructor(
    private readonly config: BucketConfig,
    private readonly scheduler: Pick<Scheduler, 'now'>,
  ) {
    this.tokens = config.capacity;
    this.updatedAt = scheduler.now();
  }

  take(): boolean {
    const now = this.scheduler.now();
    const elapsed = (now - this.updatedAt) / 1000;
    this.updatedAt = now;
    this.tokens = Math.min(this.config.capacity, this.tokens + elapsed * this.config.refillPerSecond);
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}

/** Buckets keyed by an identifier (e.g. client IP for room creation). Old keys are pruned lazily. */
export class KeyedRateLimiter {
  private readonly buckets = new Map<string, { bucket: TokenBucket; lastUsed: number }>();

  constructor(
    private readonly config: BucketConfig,
    private readonly scheduler: Pick<Scheduler, 'now'>,
  ) {}

  take(key: string): boolean {
    const now = this.scheduler.now();
    if (this.buckets.size > 5000) {
      for (const [k, entry] of this.buckets) if (now - entry.lastUsed > 10 * 60 * 1000) this.buckets.delete(k);
    }
    let entry = this.buckets.get(key);
    if (!entry) {
      entry = { bucket: new TokenBucket(this.config, this.scheduler), lastUsed: now };
      this.buckets.set(key, entry);
    }
    entry.lastUsed = now;
    return entry.bucket.take();
  }
}
