import { NextRequest, NextResponse } from "next/server";

import { backendRPC } from "@/lib/bff/backend";

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get("agbofa_session")?.value;
  if (!cookie) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const state = new URL(request.url).searchParams.get("state") ?? "";
  const result = await backendRPC("/rpc/social.v1.SocialService/Callback", { state }, {
    headers: { authorization: `Bearer ${cookie}` },
  });
  return NextResponse.json(result.data ?? { error: "oauth_denied" }, { status: result.status });
}
