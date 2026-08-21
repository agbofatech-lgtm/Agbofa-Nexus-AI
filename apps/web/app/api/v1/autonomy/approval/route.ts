import { NextRequest } from "next/server";
import { sessionRPC } from "@/lib/bff/session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const path = (body as { decide?: boolean }).decide
    ? "/rpc/autonomy.v1.AutonomyService/DecideApproval"
    : "/rpc/autonomy.v1.AutonomyService/RequestApproval";
  return sessionRPC(request, path, body);
}
