import type { NextRequest } from "next/server";
import { sessionRPC } from "@/lib/bff/session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const decide = Boolean((body as { decide?: boolean }).decide);
  const path = decide
    ? "/rpc/autonomy.v1.AutonomyService/DecideApproval"
    : "/rpc/autonomy.v1.AutonomyService/RequestApproval";
  return sessionRPC(request, path, body, 8000, { prefix: decide ? "autonomy-approval" : "autonomy-request", limit: 20 });
}
