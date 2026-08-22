import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { backendRPC } from "@/lib/bff/backend";
import { rateLimitDecisionForRequest, rateLimitedResponse } from "@/lib/bff/limits";

export async function POST(request: NextRequest) {
  const decision = rateLimitDecisionForRequest(request, "pub-tick", 6);
  if (!decision.allowed) {
    return rateLimitedResponse(decision);
  }
  const cookie = request.cookies.get("agbofa_session")?.value;
  if (!cookie) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const result = await backendRPC("/rpc/publish.v1.PublishingService/Tick", {}, {
    headers: { authorization: `Bearer ${cookie}` },
  }, 120000);
  return NextResponse.json(result.data ?? { error: result.error ?? "upstream" }, { status: result.status });
}
