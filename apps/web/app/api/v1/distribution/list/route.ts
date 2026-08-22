import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { backendRPC } from "@/lib/bff/backend";
import { rateLimitDecisionForRequest, rateLimitedResponse } from "@/lib/bff/limits";

export async function GET(request: NextRequest) {
  const decision = rateLimitDecisionForRequest(request, "distribution-read", 60);
  if (!decision.allowed) {
    return rateLimitedResponse(decision);
  }
  const cookie = request.cookies.get("agbofa_session")?.value;
  if (!cookie) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const result = await backendRPC("/rpc/social.v1.SocialService/ListDistributions", {}, {
    headers: { authorization: `Bearer ${cookie}` },
  });
  return NextResponse.json(result.data ?? { jobs: [], error: result.error ?? "upstream" }, { status: result.status });
}
