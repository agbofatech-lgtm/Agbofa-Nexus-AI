import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { backendRPC } from "@/lib/bff/backend";
import { rateLimitDecisionForRequest, rateLimitedResponse } from "@/lib/bff/limits";

export async function GET(request: NextRequest) {
  const decision = rateLimitDecisionForRequest(request, "pub-read", 60);
  if (!decision.allowed) {
    return rateLimitedResponse(decision);
  }
  const cookie = request.cookies.get("agbofa_session")?.value;
  if (!cookie) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id") ?? "";
  const result = await backendRPC(`/rpc/publish.v1.PublishingService/Get?id=${encodeURIComponent(id)}`, {}, {
    headers: { authorization: `Bearer ${cookie}` },
  });
  return NextResponse.json(result.data ?? { error: result.error ?? "upstream" }, { status: result.status });
}
