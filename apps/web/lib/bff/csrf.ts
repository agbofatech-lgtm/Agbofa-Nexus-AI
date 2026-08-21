import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { CSRF_COOKIE, CSRF_HEADER, tokensMatch } from "./csrf-core";

export { CSRF_COOKIE, CSRF_HEADER, newCsrfToken, tokensMatch } from "./csrf-core";

export function csrfCookieOptions() {
  return {
    httpOnly: false,
    secure: process.env.AGBOFA_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export function originAllowed(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    const referer = request.headers.get("referer");
    if (!referer) return true;
    try {
      return new URL(referer).origin === request.nextUrl.origin;
    } catch {
      return false;
    }
  }
  if (origin === request.nextUrl.origin) return true;
  const allow = (process.env.AGBOFA_CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return allow.includes(origin);
}

const csrfExempt = new Set(["/api/v1/auth/login"]);

export function rejectUnsafeMutation(request: NextRequest): NextResponse | null {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return null;
  const path = request.nextUrl.pathname;
  if (!path.startsWith("/api/v1/")) return null;
  if (csrfExempt.has(path)) return null;
  if (!originAllowed(request)) {
    return NextResponse.json({ error: "origin_forbidden" }, { status: 403 });
  }
  const cookie = request.cookies.get(CSRF_COOKIE)?.value ?? "";
  const header = request.headers.get(CSRF_HEADER) ?? request.headers.get("X-CSRF-Token") ?? "";
  if (!tokensMatch(cookie, header)) {
    return NextResponse.json({ error: "csrf_rejected" }, { status: 403 });
  }
  return null;
}
