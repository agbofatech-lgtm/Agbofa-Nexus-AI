import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { backendRPC } from "@/lib/bff/backend";

export async function sessionRPC(request: NextRequest, method: string, body: unknown = {}, timeoutMs = 8000) {
  const cookie = request.cookies.get("agbofa_session")?.value;
  if (!cookie) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const result = await backendRPC(method, body, { headers: { authorization: `Bearer ${cookie}` } }, timeoutMs);
  return NextResponse.json(result.data ?? { error: "upstream" }, { status: result.status });
}
