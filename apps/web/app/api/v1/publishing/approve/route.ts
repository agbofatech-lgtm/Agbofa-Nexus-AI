import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { backendRPC } from "@/lib/bff/backend";

export async function POST(request: NextRequest) {
  const cookie = request.cookies.get("agbofa_session")?.value;
  if (!cookie) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const payload = await request.json().catch(() => null);
  const result = await backendRPC("/rpc/publish.v1.PublishingService/Approve", payload, {
    headers: { authorization: `Bearer ${cookie}` },
  });
  return NextResponse.json(result.data ?? { error: "upstream" }, { status: result.status });
}
