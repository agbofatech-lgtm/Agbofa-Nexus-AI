import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { backendRPC } from "@/lib/bff/backend";
import { rateLimitDecisionForRequest, rateLimitedResponse } from "@/lib/bff/limits";

export async function POST(request: NextRequest) {
  const decision = rateLimitDecisionForRequest(request, "publish", 10);
  if (!decision.allowed) {
    return rateLimitedResponse(decision);
  }
  const cookie = request.cookies.get("agbofa_session")?.value;
  if (!cookie) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const payload = await request.json().catch(() => null);
  const result = await backendRPC("/rpc/social.v1.SocialService/CreateDistribution", payload, {
    headers: { authorization: `Bearer ${cookie}` },
  });
  const data = (result.data ?? { error: result.error ?? "upstream" }) as Record<string, unknown>;
  if (data.success === true && data.published !== true) {
    delete data.success;
  }
  return NextResponse.json(data, { status: result.status });
}
