import type { NextRequest } from "next/server";
import { sessionRPC } from "@/lib/bff/session";

export async function POST(request: NextRequest) {
  return sessionRPC(request, "/rpc/autonomy.v1.AutonomyService/KillSwitch", await request.json().catch(() => ({})));
}
