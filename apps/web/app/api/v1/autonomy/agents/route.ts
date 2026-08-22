import type { NextRequest } from "next/server";
import { sessionRPC } from "@/lib/bff/session";

export async function GET(request: NextRequest) {
  return sessionRPC(request, "/rpc/autonomy.v1.AutonomyService/ListAgents", {}, 8000, { prefix: "autonomy-read", limit: 60 });
}

export async function POST(request: NextRequest) {
  return sessionRPC(
    request,
    "/rpc/autonomy.v1.AutonomyService/EnableAgent",
    await request.json().catch(() => ({})),
    8000,
    { prefix: "autonomy-control", limit: 20 },
  );
}
