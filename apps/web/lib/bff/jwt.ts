import { createPublicKey, createVerify } from "node:crypto";

export type VerifiedAccessClaims = {
  iss: string;
  aud: string;
  sub: string;
  tenant_id: string;
  roles: string[];
  jti?: string;
  iat?: number;
  nbf: number;
  exp: number;
};

export class JwtVerifyError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "JwtVerifyError";
  }
}

function b64url(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  return Buffer.from(padded, "base64");
}

function publicPem(): string {
  const raw =
    process.env.AGBOFA_SECRET_JWT_KEYS_K1_PUBLIC_PEM ??
    process.env.AGBOFA_JWT_PUBLIC_PEM ??
    "";
  return raw.replace(/\\n/g, "\n").trim();
}

export function jwtPublicKeyConfigured(): boolean {
  return publicPem().includes("BEGIN");
}

export function verifyAccessToken(
  token: string,
  now = () => Math.floor(Date.now() / 1000),
): VerifiedAccessClaims {
  const pem = publicPem();
  if (!pem.includes("BEGIN")) {
    throw new JwtVerifyError("jwt_unconfigured");
  }
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new JwtVerifyError("invalid_token");
  }
  let header: { alg?: string; kid?: string; typ?: string };
  try {
    header = JSON.parse(b64url(parts[0]).toString("utf8")) as typeof header;
  } catch {
    throw new JwtVerifyError("invalid_token");
  }
  const alg = (header.alg ?? "").toUpperCase();
  if (!alg || alg === "NONE") throw new JwtVerifyError("alg_none");
  if (alg !== "RS256") throw new JwtVerifyError("invalid_algorithm");
  const expectedKid = process.env.AGBOFA_JWT_ACTIVE_KID ?? "k1";
  if (header.kid && header.kid !== expectedKid) throw new JwtVerifyError("unknown_kid");

  const key = createPublicKey(pem);
  const verifier = createVerify("SHA256");
  verifier.update(`${parts[0]}.${parts[1]}`);
  verifier.end();
  const ok = verifier.verify(key, b64url(parts[2]));
  if (!ok) throw new JwtVerifyError("invalid_signature");

  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(b64url(parts[1]).toString("utf8")) as Record<string, unknown>;
  } catch {
    throw new JwtVerifyError("invalid_token");
  }
  const iss = process.env.AGBOFA_JWT_ISSUER ?? "";
  const aud = process.env.AGBOFA_JWT_AUDIENCE ?? "";
  if (!iss || String(claims.iss ?? "") !== iss) throw new JwtVerifyError("invalid_issuer");
  if (!aud || String(claims.aud ?? "") !== aud) throw new JwtVerifyError("invalid_audience");
  const nbf = Number(claims.nbf ?? 0);
  const exp = Number(claims.exp ?? 0);
  const clock = now();
  if (!exp || exp <= clock) throw new JwtVerifyError("token_expired");
  if (nbf > clock) throw new JwtVerifyError("token_nbf");
  const sub = String(claims.sub ?? "");
  const tenant = String(claims.tenant_id ?? "");
  if (!sub || !tenant) throw new JwtVerifyError("invalid_token");
  const roles = Array.isArray(claims.roles) ? claims.roles.map(String) : [];
  return {
    iss: String(claims.iss),
    aud: String(claims.aud),
    sub,
    tenant_id: tenant,
    roles,
    jti: claims.jti ? String(claims.jti) : undefined,
    iat: typeof claims.iat === "number" ? claims.iat : undefined,
    nbf,
    exp,
  };
}
