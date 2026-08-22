const hits = new Map<string, { count: number; reset: number }>();

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter: number;
}

export function rateLimitDecision(key: string, limit = 30, windowMs = 60_000): RateLimitDecision {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.reset < now) {
    const reset = now + windowMs;
    hits.set(key, { count: 1, reset });
    return { allowed: true, limit, remaining: Math.max(0, limit - 1), reset, retryAfter: 0 };
  }
  current.count += 1;
  const allowed = current.count <= limit;
  const retryAfter = allowed ? 0 : Math.max(1, Math.ceil((current.reset - now) / 1000));
  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - current.count),
    reset: current.reset,
    retryAfter,
  };
}

export function rateLimit(key: string, limit = 30, windowMs = 60_000): boolean {
  return rateLimitDecision(key, limit, windowMs).allowed;
}

export function resetRateLimitForTests(): void {
  hits.clear();
}

export function clientLimitKey(input: {
  subject?: string;
  userAgent?: string | null;
}): string {
  if (input.subject && input.subject.trim()) return `sub:${input.subject.trim()}`;
  const ua = (input.userAgent ?? "unknown").slice(0, 80);
  return `anon:ua:${ua}`;
}

export function isAllowedOrigin(origin: string | null, allow: string[]): boolean {
  if (!origin) return true;
  return allow.includes(origin);
}
