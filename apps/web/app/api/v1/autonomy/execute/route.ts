import type { NextRequest } from "next/server";
import { sessionRPC } from "@/lib/bff/session";

export async function POST(request: NextRequest) {
  return sessionRPC(request, "/rpc/autonomy.v1.AutonomyService/Execute", await request.json().catch(() => ({})));
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  return sessionRPC(request, "/rpc/autonomy.v1.AutonomyService/GetExecution", { id });
}
