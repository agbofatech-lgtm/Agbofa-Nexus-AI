import { NextResponse } from "next/server";

export async function GET() {
  const base = process.env.AGBOFA_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://127.0.0.1:8080";
  try {
    const response = await fetch(`${base}/rpc/ai.v1.AIGateway/Health`, { cache: "no-store" });
    const data = await response.json().catch(() => ({ providers: [] }));
    return NextResponse.json(data, { status: response.ok ? 200 : response.status });
  } catch {
    return NextResponse.json({ providers: [], error: "upstream_unavailable" }, { status: 503 });
  }
}
