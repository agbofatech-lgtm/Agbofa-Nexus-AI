import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { rejectUnsafeMutation } from "@/lib/bff/csrf";

export function middleware(request: NextRequest) {
  const blocked = rejectUnsafeMutation(request);
  if (blocked) return blocked;
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/v1/:path*"],
};
