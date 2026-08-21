import assert from "node:assert/strict";
import { generateKeyPairSync, createSign } from "node:crypto";
import { test } from "node:test";
import { JwtVerifyError, verifyAccessToken } from "./jwt.ts";

function b64url(buf: Buffer | string): string {
  const raw = typeof buf === "string" ? Buffer.from(buf) : buf;
  return raw.toString("base64url");
}

function token(opts: {
  privateKey: string;
  alg?: string;
  kid?: string;
  iss?: string;
  aud?: string;
  sub?: string;
  tenant?: string;
  nbf?: number;
  exp?: number;
  mutateUnsigned?: boolean;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(
    JSON.stringify({ alg: opts.alg ?? "RS256", typ: "JWT", kid: opts.kid ?? "k1" }),
  );
  const payload = b64url(
    JSON.stringify({
      iss: opts.iss ?? "https://auth.example.invalid",
      aud: opts.aud ?? "agbofa-nexus-ai",
      sub: opts.sub ?? "user-1",
      tenant_id: opts.tenant ?? "tenant-1",
      roles: ["TENANT_ADMIN"],
      nbf: opts.nbf ?? now - 5,
      exp: opts.exp ?? now + 600,
    }),
  );
  const unsigned = `${header}.${payload}`;
  const signer = createSign("SHA256");
  signer.update(unsigned);
  signer.end();
  const sig = signer.sign(opts.privateKey).toString("base64url");
  if (opts.mutateUnsigned) return `${unsigned}.${sig}x`;
  return `${unsigned}.${sig}`;
}

const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
const publicPem = pair.publicKey.export({ type: "spki", format: "pem" }).toString();
const privatePem = pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString();

test("verifyAccessToken accepts a valid RS256 token", () => {
  process.env.AGBOFA_SECRET_JWT_KEYS_K1_PUBLIC_PEM = publicPem;
  process.env.AGBOFA_JWT_ISSUER = "https://auth.example.invalid";
  process.env.AGBOFA_JWT_AUDIENCE = "agbofa-nexus-ai";
  process.env.AGBOFA_JWT_ACTIVE_KID = "k1";
  const claims = verifyAccessToken(token({ privateKey: privatePem }));
  assert.equal(claims.sub, "user-1");
  assert.equal(claims.tenant_id, "tenant-1");
});

test("rejects alg=none", () => {
  process.env.AGBOFA_SECRET_JWT_KEYS_K1_PUBLIC_PEM = publicPem;
  process.env.AGBOFA_JWT_ISSUER = "https://auth.example.invalid";
  process.env.AGBOFA_JWT_AUDIENCE = "agbofa-nexus-ai";
  assert.throws(
    () => verifyAccessToken(token({ privateKey: privatePem, alg: "none" })),
    (err: unknown) => err instanceof JwtVerifyError && err.code === "alg_none",
  );
});

test("rejects invalid signature", () => {
  process.env.AGBOFA_SECRET_JWT_KEYS_K1_PUBLIC_PEM = publicPem;
  process.env.AGBOFA_JWT_ISSUER = "https://auth.example.invalid";
  process.env.AGBOFA_JWT_AUDIENCE = "agbofa-nexus-ai";
  assert.throws(
    () => verifyAccessToken(token({ privateKey: privatePem, mutateUnsigned: true })),
    (err: unknown) => err instanceof JwtVerifyError && err.code === "invalid_signature",
  );
});

test("rejects wrong issuer and audience", () => {
  process.env.AGBOFA_SECRET_JWT_KEYS_K1_PUBLIC_PEM = publicPem;
  process.env.AGBOFA_JWT_ISSUER = "https://auth.example.invalid";
  process.env.AGBOFA_JWT_AUDIENCE = "agbofa-nexus-ai";
  assert.throws(
    () => verifyAccessToken(token({ privateKey: privatePem, iss: "https://evil.example" })),
    (err: unknown) => err instanceof JwtVerifyError && err.code === "invalid_issuer",
  );
  assert.throws(
    () => verifyAccessToken(token({ privateKey: privatePem, aud: "other" })),
    (err: unknown) => err instanceof JwtVerifyError && err.code === "invalid_audience",
  );
});

test("rejects expired and nbf-future tokens", () => {
  process.env.AGBOFA_SECRET_JWT_KEYS_K1_PUBLIC_PEM = publicPem;
  process.env.AGBOFA_JWT_ISSUER = "https://auth.example.invalid";
  process.env.AGBOFA_JWT_AUDIENCE = "agbofa-nexus-ai";
  const now = Math.floor(Date.now() / 1000);
  assert.throws(
    () => verifyAccessToken(token({ privateKey: privatePem, exp: now - 10 })),
    (err: unknown) => err instanceof JwtVerifyError && err.code === "token_expired",
  );
  assert.throws(
    () => verifyAccessToken(token({ privateKey: privatePem, nbf: now + 3600, exp: now + 7200 })),
    (err: unknown) => err instanceof JwtVerifyError && err.code === "token_nbf",
  );
});

test("fails closed without PEM", () => {
  delete process.env.AGBOFA_SECRET_JWT_KEYS_K1_PUBLIC_PEM;
  delete process.env.AGBOFA_JWT_PUBLIC_PEM;
  assert.throws(
    () => verifyAccessToken("a.b.c"),
    (err: unknown) => err instanceof JwtVerifyError && err.code === "jwt_unconfigured",
  );
});
