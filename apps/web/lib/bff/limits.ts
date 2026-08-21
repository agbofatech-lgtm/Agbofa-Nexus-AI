import type { NextRequest } from "next/server";
import { verifyAccessToken } from "./jwt";
import { clientLimitKey, rateLimit } from "./limits-core";

export { clientLimitKey, isAllowedOrigin, rateLimit, resetRateLimitForTests } from "./limits-core";

/**
 * Process-local limiter. Multi-instance / serverless horizontal scale is NOT
 * covered — that remains BLOCKED without a shared store.
 * Identity must not be solely a client-controlled X-Forwarded-For value.
 */
export function rateLimitRequest(request: NextRequest, prefix: string, limit = 30): boolean {
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
  return rateLimit(key, limit);
}
