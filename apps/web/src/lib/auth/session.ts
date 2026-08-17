/**
 * Agbofa Nexus AI — BFF Session & Token Management (P0 Batch 2)
 * Manages Access Token session handling and HttpOnly __Host-nexus-refresh-token cookie storage.
 * Enforces fast-fail JWT expiration verification while treating Go gRPC backend as authoritative.
 *
 * NOTE: RLS tenant isolation gap — SET LOCAL app.current_tenant not executed by Go repositories.
 * Backend fix required before production.
 */

export const REFRESH_TOKEN_COOKIE_NAME = "__Host-nexus-refresh-token";
export const ACCESS_TOKEN_COOKIE_NAME = "__Host-nexus-access-token";
export const CSRF_HEADER_NAME = "x-nexus-csrf-token";

export const RLS_TENANT_ISOLATION_GAP_WARNING =
  "RLS tenant isolation gap — SET LOCAL app.current_tenant not executed by Go repositories. Backend fix required before production.";

export interface JwtTokenClaims {
  token_id?: string;
  sub?: string;
  user_id?: string;
  tenant_id?: string;
  roles?: string[];
  exp?: number;
  iat?: number;
}

export interface FastFailJwtResult {
  valid: boolean;
  claims?: JwtTokenClaims;
  error?: string;
}

/**
 * Parses and verifies JWT expiration in-memory for fast-fail rejection before RPC TCP hops.
 * NOTE: The Go backend (TenantIdentityService / Interceptor) remains authoritative for signature and RBAC.
 */
export function verifyJwtFastFail(token?: string): FastFailJwtResult {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "missing_token" };
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false, error: "invalid_jwt_format" };
  }

  try {
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payloadBase64.padEnd(payloadBase64.length + ((4 - (payloadBase64.length % 4)) % 4), "=");
    const decodedJson = Buffer.from(padded, "base64").toString("utf-8");
    const claims = JSON.parse(decodedJson) as JwtTokenClaims;

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (claims.exp && claims.exp < nowSeconds) {
      return { valid: false, error: "token_expired", claims };
    }

    return { valid: true, claims };
  } catch {
    return { valid: false, error: "jwt_parse_error" };
  }
}

export interface CookieWriter {
  set(name: string, value: string, options: Record<string, unknown>): void;
  delete(name: string, options?: Record<string, unknown>): void;
  get(name: string): { value: string } | undefined;
}

/**
 * Sets the refresh token using strict HttpOnly __Host- prefix security attributes.
 */
export function setRefreshTokenCookie(cookies: CookieWriter, refreshToken: string, maxAgeSeconds = 604800): void {
  cookies.set(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

/**
 * Sets access token cookie for server-side session handling.
 */
export function setAccessTokenCookie(cookies: CookieWriter, accessToken: string, maxAgeSeconds = 3600): void {
  cookies.set(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

/**
 * Clears both access and refresh token cookies on logout or revocation.
 */
export function clearAuthCookies(cookies: CookieWriter): void {
  cookies.delete(REFRESH_TOKEN_COOKIE_NAME, { path: "/" });
  cookies.delete(ACCESS_TOKEN_COOKIE_NAME, { path: "/" });
}

export function getRefreshTokenFromCookies(cookies: CookieWriter): string | undefined {
  return cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
}

export function getAccessTokenFromCookies(cookies: CookieWriter): string | undefined {
  return cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
}
