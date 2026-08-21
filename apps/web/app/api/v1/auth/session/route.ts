import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { JwtVerifyError, verifyAccessToken } from "@/lib/bff/jwt";
import { presentRole } from "@/lib/bff/roles";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("agbofa_session")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  try {
    const claims = verifyAccessToken(token);
    return NextResponse.json({
      authenticated: true,
      session: {
        tenant: claims.tenant_id,
        user: {
          id: claims.sub,
          name: claims.sub,
          email: claims.sub,
          role: presentRole(claims.roles),
        },
        expiresAt: new Date(claims.exp * 1000).toISOString(),
      },
    });
  } catch (error) {
    const code = error instanceof JwtVerifyError ? error.code : "unauthenticated";
    return NextResponse.json({ authenticated: false, reason: code }, { status: 401 });
  }
}
