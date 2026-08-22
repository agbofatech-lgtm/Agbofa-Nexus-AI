import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { backendRPC } from "@/lib/bff/backend";
import { CSRF_COOKIE, csrfCookieOptions, newCsrfToken } from "@/lib/bff/csrf";
import { rateLimitDecisionForRequest, rateLimitedResponse } from "@/lib/bff/limits";
import { presentRole } from "@/lib/bff/roles";
import { loginSchema } from "@/lib/validations/login.schema";

function decodeJwtPayload(token: string): Record<string, unknown> {
  const part = token.split(".")[1];
  if (!part) return {};
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  const decision = rateLimitDecisionForRequest(request, "login", 30);
  if (!decision.allowed) {
    return rateLimitedResponse(decision);
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_argument" }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_argument" }, { status: 400 });
  }

  const result = await backendRPC<{
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
  }>("/rpc/foundation.tenant_identity.v1.TenantIdentityService/AuthenticateUser", {
    tenant_name: parsed.data.tenant,
    principal_name: parsed.data.admin,
    credential: parsed.data.password,
  });

  if (!result.ok || !result.data?.access_token) {
    return NextResponse.json(
      { success: false, code: "invalid_credentials", message: "Invalid credentials." },
      { status: 401 },
    );
  }

  const claims = decodeJwtPayload(result.data.access_token);
  const roles = Array.isArray(claims.roles) ? claims.roles.map(String) : [];
  const response = NextResponse.json({
    success: true,
    session: {
      tenant: String(claims.tenant_id ?? parsed.data.tenant),
      user: {
        id: String(claims.sub ?? ""),
        name: parsed.data.admin,
        email: parsed.data.admin,
        role: presentRole(roles),
      },
      expiresAt: new Date(
        (typeof claims.exp === "number" ? claims.exp * 1000 : Date.now() + 900_000),
      ).toISOString(),
    },
  });

  const secure = process.env.AGBOFA_ENV === "production";
  response.cookies.set("agbofa_session", result.data.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
  });
  if (result.data.refresh_token) {
    response.cookies.set("agbofa_refresh", result.data.refresh_token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
    });
  }
  response.cookies.set(CSRF_COOKIE, newCsrfToken(), csrfCookieOptions());
  return response;
}
