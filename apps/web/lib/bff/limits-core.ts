const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
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
