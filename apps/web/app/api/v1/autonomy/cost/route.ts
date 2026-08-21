import type { NextRequest } from "next/server";
import { sessionRPC } from "@/lib/bff/session";

export async function GET(request: NextRequest) {
  const kind = request.nextUrl.searchParams.get("kind");
  if (kind === "strategies") return sessionRPC(request, "/rpc/autonomy.v1.AutonomyService/Strategies", {});
  return sessionRPC(request, "/rpc/autonomy.v1.AutonomyService/Usage", {});
}
export async function POST(request: NextRequest) {
  return sessionRPC(request, "/rpc/autonomy.v1.AutonomyService/Routing", await request.json().catch(() => ({})));
}
