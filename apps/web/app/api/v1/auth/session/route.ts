import { NextRequest, NextResponse } from "next/server";

import { presentRole } from "@/lib/bff/roles";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("agbofa_session")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  const part = token.split(".")[1];
  if (!part) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as Record<
      string,
      unknown
    >;
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  const exp = typeof claims.exp === "number" ? claims.exp : 0;
  if (exp * 1000 <= Date.now()) {
    return NextResponse.json({ authenticated: false, reason: "expired" }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    session: {
      tenant: String(claims.tenant_id ?? ""),
      user: {
        id: String(claims.sub ?? ""),
        name: String(claims.sub ?? ""),
        email: String(claims.sub ?? ""),
        role: presentRole(Array.isArray(claims.roles) ? claims.roles.map(String) : []),
      },
      expiresAt: new Date(exp * 1000).toISOString(),
    },
  });
}
