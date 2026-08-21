import { NextRequest } from "next/server";
import { sessionRPC } from "@/lib/bff/session";

export async function GET(request: NextRequest) {
  return sessionRPC(request, "/rpc/autonomy.v1.AutonomyService/GetControl", {});
}
