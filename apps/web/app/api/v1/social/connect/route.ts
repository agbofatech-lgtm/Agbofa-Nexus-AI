import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { backendRPC } from "@/lib/bff/backend";
import { rateLimitRequest } from "@/lib/bff/limits";

function redirectURI(request: NextRequest, platform: string): string {
  const key = `AGBOFA_SOCIAL_${platform.toUpperCase()}_REDIRECT_URI`;
  const configured = process.env[key];
  if (configured) return configured;
  return `${request.nextUrl.origin}/api/v1/social/callback`;
}

async function startConnect(request: NextRequest, platform: string, redirect: string) {
  if (!rateLimitRequest(request, "social", 20)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const cookie = request.cookies.get("agbofa_session")?.value;
  if (!cookie) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (!platform) {
    return NextResponse.json({ error: "unknown_platform" }, { status: 400 });
  }
  const result = await backendRPC<{ authorization_url?: string; error?: string }>(
    "/rpc/social.v1.SocialService/Connect",
    { platform, redirect_uri: redirect },
    { headers: { authorization: `Bearer ${cookie}` } },
  );
  const url = result.data?.authorization_url;
  if (!result.ok || !url) {
    return NextResponse.json(result.data ?? { error: "upstream" }, { status: result.status || 502 });
  }
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const platform = request.nextUrl.searchParams.get("platform") ?? "";
  return startConnect(request, platform, redirectURI(request, platform));
}

export async function POST(request: NextRequest) {
  const cookie = request.cookies.get("agbofa_session")?.value;
  if (!cookie) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const payload = (await request.json().catch(() => null)) as
    | { platform?: string; redirect_uri?: string }
    | null;
  const platform = payload?.platform ?? "";
  const redirect = payload?.redirect_uri || redirectURI(request, platform);
  const result = await backendRPC("/rpc/social.v1.SocialService/Connect", {
    platform,
    redirect_uri: redirect,
  }, { headers: { authorization: `Bearer ${cookie}` } });
  return NextResponse.json(result.data ?? { error: "upstream" }, { status: result.status });
}
