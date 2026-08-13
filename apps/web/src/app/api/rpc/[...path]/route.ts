/**
 * Agbofa Nexus AI - Next.js BFF RPC route
 * Identity methods are proxied to Foundation TenantIdentityService.
 * Non-identity allowlisted methods remain offline stubs and never echo credentials.
 * Tokens are stored only in HttpOnly cookies and are never returned in JSON.
 *
 * IMP-BFF-AUTH-001
 */

import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
  type CookieWriter,
} from "../../../../lib/auth/session";
import { isRpcAllowed, buildNormalizedError } from "../../../../lib/rpc-config";
import {
  foundationAuthenticateUser,
  foundationGetTenant,
  foundationRefreshToken,
  foundationValidateToken,
  mapFoundationError,
  type FoundationClaims,
} from "../../../../lib/bff/foundation-identity";

const IDENTITY_METHODS = new Set(["AuthenticateUser", "ValidateToken", "RefreshToken", "GetTenant"]);

function claimsPayload(claims: FoundationClaims): Record<string, unknown> {
  return {
    subject: claims.subject,
    tenant_id: claims.tenant_id,
    roles: Array.isArray(claims.roles) ? claims.roles : [],
    issuer: claims.issuer,
    audience: claims.audience || [],
    token_id: claims.token_id,
  };
}

function success(data: unknown, correlationId: string, cookies?: (res: NextResponse) => void): NextResponse {
  const res = NextResponse.json(
    {
      status: "SUCCESS",
      data,
      correlationId,
      timestamp: new Date().toISOString(),
    },
    { status: 200, headers: { "x-correlation-id": correlationId } },
  );
  if (cookies) {
    cookies(res);
  }
  return res;
}

function asCookieWriter(cookies: NextResponse["cookies"]): CookieWriter {
  return {
    set(name, value, options) {
      cookies.set(name, value, options as never);
    },
    delete(name, options) {
      if (options) {
        cookies.delete({ name, ...(options as object) } as never);
      } else {
        cookies.delete(name);
      }
    },
    get(name) {
      return cookies.get(name);
    },
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } },
): Promise<NextResponse> {
  const correlationId =
    request.headers.get("x-correlation-id") || `bff-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  const pathParts = params.path || [];
  if (pathParts.length < 2) {
    return buildNormalizedError(
      400,
      "INVALID_REQUEST",
      "RPC request must include service and method in URL path (/api/rpc/[service]/[method])",
      correlationId,
    );
  }

  const serviceName = decodeURIComponent(pathParts[0]);
  const methodName = decodeURIComponent(pathParts[1]);

  if (!isRpcAllowed(serviceName, methodName)) {
    return buildNormalizedError(
      404,
      "NOT_FOUND_OR_UNAUTHORIZED_RPC",
      `RPC method ${serviceName}/${methodName} is not permitted by the authoritative P0 allowlist`,
      correlationId,
    );
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    payload = {};
  }

  if (IDENTITY_METHODS.has(methodName)) {
    return handleIdentity(request, methodName, payload, correlationId);
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value || bearerToken(request);
  if (!accessToken) {
    return buildNormalizedError(401, "UNAUTHENTICATED", "valid access token required", correlationId);
  }
  try {
    await foundationValidateToken(accessToken);
  } catch (err) {
    const mapped = mapFoundationError(err);
    return buildNormalizedError(mapped.status, mapped.code, mapped.message, correlationId);
  }

  return stubNonIdentity(methodName, correlationId);
}

async function handleIdentity(
  request: NextRequest,
  methodName: string,
  payload: Record<string, unknown>,
  correlationId: string,
): Promise<NextResponse> {
  try {
    if (methodName === "AuthenticateUser") {
      const tenantName = String(payload.tenant_name || "");
      const principalName = String(payload.principal_name || "");
      const credential = String(payload.credential || "");
      if (!tenantName || !principalName || !credential) {
        return buildNormalizedError(400, "INVALID_REQUEST", "tenant_name, principal_name, and credential are required", correlationId);
      }
      const tokens = await foundationAuthenticateUser({
        tenant_name: tenantName,
        principal_name: principalName,
        credential,
      });
      const claims = await foundationValidateToken(tokens.accessToken);
      return success(claimsPayload(claims), correlationId, (res) => {
        const jar = asCookieWriter(res.cookies);
        setAccessTokenCookie(jar, tokens.accessToken, tokens.expiresIn || 3600);
        setRefreshTokenCookie(jar, tokens.refreshToken, 604800);
      });
    }

    if (methodName === "ValidateToken") {
      if (payload && payload.logout === true) {
        return success({ logged_out: true }, correlationId, (res) => {
          clearAuthCookies(asCookieWriter(res.cookies));
        });
      }
      const accessToken =
        request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value ||
        bearerToken(request) ||
        String(payload.access_token || "");
      if (!accessToken) {
        return buildNormalizedError(401, "UNAUTHENTICATED", "valid access token required", correlationId);
      }
      const claims = await foundationValidateToken(accessToken);
      return success(claimsPayload(claims), correlationId);
    }

    if (methodName === "RefreshToken") {
      const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
      if (!refreshToken) {
        return buildNormalizedError(401, "UNAUTHENTICATED", "refresh credential required", correlationId);
      }
      const tokens = await foundationRefreshToken(refreshToken);
      const claims = await foundationValidateToken(tokens.accessToken);
      return success(claimsPayload(claims), correlationId, (res) => {
        const jar = asCookieWriter(res.cookies);
        setAccessTokenCookie(jar, tokens.accessToken, tokens.expiresIn || 3600);
        setRefreshTokenCookie(jar, tokens.refreshToken, 604800);
      });
    }

    if (methodName === "GetTenant") {
      const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value || bearerToken(request);
      if (!accessToken) {
        return buildNormalizedError(401, "UNAUTHENTICATED", "valid access token required", correlationId);
      }
      const claims = await foundationValidateToken(accessToken);
      const requested = String(payload.id || claims.tenant_id);
      if (!requested || requested !== claims.tenant_id) {
        return buildNormalizedError(403, "FORBIDDEN", "tenant access denied", correlationId);
      }
      const tenant = await foundationGetTenant(requested, accessToken);
      return success(tenant, correlationId);
    }

    return buildNormalizedError(404, "NOT_FOUND_OR_UNAUTHORIZED_RPC", "unknown identity method", correlationId);
  } catch (err) {
    const mapped = mapFoundationError(err);
    return buildNormalizedError(mapped.status, mapped.code, mapped.message, correlationId);
  }
}

function bearerToken(request: NextRequest): string {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.substring(7);
  }
  return "";
}

function stubNonIdentity(methodName: string, correlationId: string): NextResponse {
  if (methodName === "ListPackages") {
    return success(
      {
        packages: [
          {
            package_id: "pkg-101",
            tenant_id: "tenant-default",
            story_id: "story-101",
            title: "Autonomous AI Newsroom Workforce Expands",
            status: "APPROVED",
            articles: [
              {
                asset_id: "art-101",
                headline: "Autonomous AI Newsroom Workforce Expands",
                summary: "Agbofa Nexus AI deploys 32 specialized agents.",
                language: "en-US",
              },
            ],
            qa_report: { qa_id: "qa-101", overall_quality_score: 0.96, passed: true },
          },
        ],
      },
      correlationId,
    );
  }
  if (methodName === "ListSources") {
    return success(
      {
        sources: [
          { source_id: "src-reuters", name: "Reuters Wire Feed", source_type: "WIRE", reliability_score: 0.98, active: true },
        ],
      },
      correlationId,
    );
  }
  if (methodName === "GetPackage") {
    return success(
      {
        content_package: {
          package_id: "pkg-101",
          tenant_id: "tenant-default",
          story_id: "story-101",
          title: "Autonomous AI Newsroom Workforce Expands",
          status: "APPROVED",
        },
      },
      correlationId,
    );
  }
  return success(
    {
      service: "stub",
      method: methodName,
    },
    correlationId,
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return buildNormalizedError(
    400,
    "INVALID_REQUEST",
    "BFF RPC endpoint expects POST request with JSON payload",
    request.headers.get("x-correlation-id") || "bff-err",
  );
}