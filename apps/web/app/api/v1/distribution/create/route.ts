import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { backendRPC } from "@/lib/bff/backend";
import { rateLimitRequest } from "@/lib/bff/limits";

export async function POST(request: NextRequest) {
  if (!rateLimitRequest(request, "publish", 10)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const cookie = request.cookies.get("agbofa_session")?.value;
  if (!cookie) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const payload = await request.json().catch(() => null);
  const result = await backendRPC("/rpc/social.v1.SocialService/CreateDistribution", payload, {
    headers: { authorization: `Bearer ${cookie}` },
  });
  return NextResponse.json(result.data ?? { error: "upstream" }, { status: result.status });
}
