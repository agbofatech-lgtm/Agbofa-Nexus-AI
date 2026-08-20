import { NextRequest, NextResponse } from "next/server";

import { backendRPC } from "@/lib/bff/backend";

export async function POST(request: NextRequest) {
  const cookie = request.cookies.get("agbofa_session")?.value;
  if (!cookie) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const result = await backendRPC("/rpc/publish.v1.PublishingService/Tick", {}, {
    headers: { authorization: `Bearer ${cookie}` },
  }, 120000);
  return NextResponse.json(result.data ?? { error: "upstream" }, { status: result.status });
}
