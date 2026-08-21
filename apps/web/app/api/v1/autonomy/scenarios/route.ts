import type { NextRequest } from "next/server";
import { sessionRPC } from "@/lib/bff/session";

export async function GET(request: NextRequest) {
  return sessionRPC(request, "/rpc/autonomy.v1.AutonomyService/ListScenarios", {});
}
export async function POST(request: NextRequest) {
  return sessionRPC(request, "/rpc/autonomy.v1.AutonomyService/CreateScenario", await request.json().catch(() => ({})));
}
