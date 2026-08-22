import type { NextRequest } from "next/server";
import { sessionRPC } from "@/lib/bff/session";

export async function GET(request: NextRequest) {
  const kind = request.nextUrl.searchParams.get("kind");
  if (kind === "strategies") {
    return sessionRPC(request, "/rpc/autonomy.v1.AutonomyService/Strategies", {}, 8000, { prefix: "autonomy-read", limit: 60 });
  }
  return sessionRPC(request, "/rpc/autonomy.v1.AutonomyService/Usage", {}, 8000, { prefix: "autonomy-read", limit: 60 });
}

export async function POST(request: NextRequest) {
  return sessionRPC(
    request,
    "/rpc/autonomy.v1.AutonomyService/Routing",
    await request.json().catch(() => ({})),
    8000,
    { prefix: "autonomy-cost", limit: 30 },
  );
}
