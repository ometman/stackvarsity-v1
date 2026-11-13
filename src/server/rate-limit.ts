import "server-only";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
  reset?(key: string): Promise<void>;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Process-local fixed-window rate limiter suitable for local development and tests.
 * Production multi-instance deployments must configure a distributed store (e.g., Redis/Upstash or PostgreSQL).
 */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  async consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      const resetAt = now + windowMs;
      this.buckets.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        remaining: Math.max(0, limit - 1),
        resetAt,
        retryAfterSeconds: Math.ceil(windowMs / 1000),
      };
    }

    if (existing.count >= limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        resetAt: existing.resetAt,
        retryAfterSeconds,
      };
    }

    existing.count += 1;
    return {
      allowed: true,
      remaining: Math.max(0, limit - existing.count),
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  async reset(key: string): Promise<void> {
    this.buckets.delete(key);
  }

  clearAll(): void {
    this.buckets.clear();
  }
}

const globalForRateLimit = globalThis as unknown as {
  rateLimiter?: InMemoryRateLimiter;
};

export function getRateLimiter(): InMemoryRateLimiter {
  if (!globalForRateLimit.rateLimiter) {
    globalForRateLimit.rateLimiter = new InMemoryRateLimiter();
  }
  return globalForRateLimit.rateLimiter;
}

/**
 * Extracts a client IP identifier from standard proxy headers for rate limiting.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
