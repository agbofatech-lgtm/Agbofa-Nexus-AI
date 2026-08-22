import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { backendRPC } from "@/lib/bff/backend";
import { rateLimitDecisionForRequest, rateLimitedResponse } from "@/lib/bff/limits";

export async function POST(request: NextRequest) {
  const decision = rateLimitDecisionForRequest(request, "ai", 20);
  if (!decision.allowed) {
    return rateLimitedResponse(decision);
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_argument" }, { status: 400 });
  }
  const cookie = request.cookies.get("agbofa_session")?.value;
  if (!cookie) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const result = await backendRPC<Record<string, unknown>>("/rpc/ai.v1.AIGateway/Complete", payload, {
    headers: {
      cookie: `agbofa_session=${cookie}`,
      authorization: `Bearer ${cookie}`,
      "x-correlation-id": request.headers.get("x-correlation-id") ?? "",
    },
  });
  return NextResponse.json(result.data ?? { error: result.error ?? "upstream" }, { status: result.status });
}
