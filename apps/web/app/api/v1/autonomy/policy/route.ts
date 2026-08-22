import type { NextRequest } from "next/server";
import { sessionRPC } from "@/lib/bff/session";

export async function POST(request: NextRequest) {
  return sessionRPC(
    request,
    "/rpc/autonomy.v1.AutonomyService/CreatePolicy",
    await request.json().catch(() => ({})),
    8000,
    { prefix: "autonomy-control", limit: 10 },
  );
}
