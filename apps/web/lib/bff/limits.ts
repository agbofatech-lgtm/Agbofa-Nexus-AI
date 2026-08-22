import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyAccessToken } from "./jwt";
import { clientLimitKey, rateLimit, rateLimitDecision, type RateLimitDecision } from "./limits-core";

export {
  clientLimitKey,
  isAllowedOrigin,
  rateLimit,
  rateLimitDecision,
  resetRateLimitForTests,
} from "./limits-core";

/**
 * Process-local limiter. Multi-instance / serverless horizontal scale is NOT
 * covered — that remains BLOCKED without a shared store.
 * Identity must not be solely a client-controlled X-Forwarded-For value.
 */
export function rateLimitDecisionForRequest(
  request: NextRequest,
  prefix: string,
  limit = 30,
  windowMs = 60_000,
): RateLimitDecision {
  let subject = "";
  const token = request.cookies.get("agbofa_session")?.value;
  if (token) {
    try {
      subject = verifyAccessToken(token).sub;
    } catch {
      /* unauthenticated callers remain anonymous-UA keyed */
    }
  }
  const key = `${prefix}:${clientLimitKey({ subject, userAgent: request.headers.get("user-agent") })}`;
  return rateLimitDecision(key, limit, windowMs);
}

export function rateLimitRequest(request: NextRequest, prefix: string, limit = 30): boolean {
  return rateLimitDecisionForRequest(request, prefix, limit).allowed;
}

export function rateLimitedResponse(decision: RateLimitDecision) {
  const headers = new Headers({
    "Retry-After": String(Math.max(1, decision.retryAfter || 60)),
    "X-RateLimit-Limit": String(decision.limit),
    "X-RateLimit-Remaining": String(decision.remaining),
    "X-RateLimit-Reset": new Date(decision.reset).toISOString(),
  });
  return NextResponse.json({ error: "rate_limited" }, { status: 429, headers });
}
