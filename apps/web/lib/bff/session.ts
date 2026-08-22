import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendRPC } from "@/lib/bff/backend";
import { rateLimitDecisionForRequest, rateLimitedResponse } from "@/lib/bff/limits";

export async function sessionRPC(
  request: NextRequest,
  method: string,
  body: unknown = {},
  timeoutMs = 8000,
  rateLimit?: { prefix: string; limit?: number },
) {
  if (rateLimit) {
    const decision = rateLimitDecisionForRequest(request, rateLimit.prefix, rateLimit.limit ?? 30);
    if (!decision.allowed) return rateLimitedResponse(decision);
  }
  const cookie = request.cookies.get("agbofa_session")?.value;
  if (!cookie) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const result = await backendRPC(method, body, { headers: { authorization: `Bearer ${cookie}` } }, timeoutMs);
  return NextResponse.json(result.data ?? { error: result.error ?? "upstream" }, { status: result.status });
}
