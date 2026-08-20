import { NextRequest, NextResponse } from "next/server";

import { backendRPC } from "@/lib/bff/backend";

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get("agbofa_session")?.value;
  if (!cookie) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const result = await backendRPC("/rpc/social.v1.SocialService/ListDistributions", {}, {
    headers: { authorization: `Bearer ${cookie}` },
  });
  return NextResponse.json(result.data ?? { jobs: [] }, { status: result.status });
}
