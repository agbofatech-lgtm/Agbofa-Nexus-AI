import { NextRequest, NextResponse } from "next/server";

import { backendRPC } from "@/lib/bff/backend";

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get("agbofa_session")?.value;
  if (!cookie) {
    const login = new URL("/login", request.nextUrl.origin);
    login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }
  const oauthError = request.nextUrl.searchParams.get("error");
  if (oauthError) {
    const dest = new URL("/distribution/accounts", request.nextUrl.origin);
    dest.searchParams.set("connected", "false");
    dest.searchParams.set("error", "oauth_denied");
    return NextResponse.redirect(dest);
  }
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const result = await backendRPC<{
    connected?: boolean;
    status?: string;
    platform?: string;
    error?: string;
  }>("/rpc/social.v1.SocialService/Callback", { state, code }, {
    headers: { authorization: `Bearer ${cookie}` },
  });
  const dest = new URL("/distribution/accounts", request.nextUrl.origin);
  dest.searchParams.set("connected", result.data?.connected ? "true" : "false");
  if (result.data?.platform) dest.searchParams.set("platform", result.data.platform);
  if (!result.ok || !result.data?.connected) {
    dest.searchParams.set("error", result.data?.error ?? "oauth_exchange_failed");
  }
  return NextResponse.redirect(dest);
}

export async function POST(request: NextRequest) {
  const cookie = request.cookies.get("agbofa_session")?.value;
  if (!cookie) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const payload = await request.json().catch(() => null);
  const result = await backendRPC("/rpc/social.v1.SocialService/Callback", payload, {
    headers: { authorization: `Bearer ${cookie}` },
  });
  const data = (result.data ?? { error: "upstream" }) as Record<string, unknown>;
  delete data.access_token;
  delete data.refresh_token;
  delete data.code;
  return NextResponse.json(data, { status: result.status });
}
