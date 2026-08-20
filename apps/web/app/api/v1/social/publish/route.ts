import { NextRequest, NextResponse } from "next/server";

import { backendRPC } from "@/lib/bff/backend";
import { rateLimit } from "@/lib/bff/limits";

export async function POST(request: NextRequest) {
  if (!rateLimit(`publish:${request.headers.get("x-forwarded-for") ?? "local"}`, 10)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const cookie = request.cookies.get("agbofa_session")?.value;
  if (!cookie) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const payload = await request.json().catch(() => null);
  const result = await backendRPC("/rpc/social.v1.SocialService/CreateDistribution", payload, {
    headers: { authorization: `Bearer ${cookie}` },
  });
  const data = (result.data ?? { error: "upstream" }) as Record<string, unknown>;
  if (data.success === true && data.published !== true) {
    delete data.success;
  }
  return NextResponse.json(data, { status: result.status });
}
