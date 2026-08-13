/**
 * Foundation TenantIdentityService client.
 * Speaks unary HTTP/1.1 protobuf with gRPC-Web-compatible framing to
 * FOUNDATION_GRPC_ENDPOINT. This is not official grpc-go / @grpc/grpc-js.
 * Tokens stay on the server; this module never logs credentials.
 *
 * IMP-BFF-AUTH-001
 */

export const FOUNDATION_SERVICE = "foundation.tenant_identity.v1.TenantIdentityService";

export interface FoundationTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface FoundationClaims {
  subject: string;
  tenant_id: string;
  roles: string[];
  issuer: string;
  audience: string[];
  token_id: string;
}

export interface FoundationTenant {
  id: string;
  name: string;
  status: number;
  created_at: string;
}

export class FoundationIdentityError extends Error {
  constructor(
    readonly grpcStatus: number,
    message: string,
  ) {
    super(message);
    this.name = "FoundationIdentityError";
  }
}

function endpoint(): string {
  const named = process.env.FOUNDATION_GRPC_ENDPOINT;
  const fallback = process.env.GRPC_BACKEND_ENDPOINT;
  const raw = (named || fallback || "127.0.0.1:9090").replace(/\/$/, "");
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  return `http://${raw}`;
}

function encodeVarint(value: number): number[] {
  const out: number[] = [];
  let x = value >>> 0;
  while (x > 0x7f) {
    out.push((x & 0x7f) | 0x80);
    x >>>= 7;
  }
  out.push(x);
  return out;
}

function appendString(buf: number[], field: number, value: string): void {
  if (!value) return;
  const bytes = Buffer.from(value, "utf8");
  buf.push((field << 3) | 2, ...encodeVarint(bytes.length), ...bytes);
}

function frame(payload: Uint8Array): Buffer {
  const hdr = Buffer.alloc(5);
  hdr.writeUInt32BE(payload.length, 1);
  return Buffer.concat([hdr, Buffer.from(payload)]);
}

function readFrame(body: Buffer): { payload: Buffer; grpcStatus: number; grpcMessage: string } {
  if (body.length < 5) {
    return { payload: Buffer.alloc(0), grpcStatus: 13, grpcMessage: "short grpc frame" };
  }
  const len = body.readUInt32BE(1);
  const payload = body.subarray(5, 5 + len);
  let grpcStatus = 0;
  let grpcMessage = "";
  const offset = 5 + len;
  if (offset + 5 <= body.length && body[offset] === 0x80) {
    const tlen = body.readUInt32BE(offset + 1);
    const trailer = body.subarray(offset + 5, offset + 5 + tlen).toString("utf8");
    const statusMatch = trailer.match(/grpc-status:\s*(\d+)/);
    const msgMatch = trailer.match(/grpc-message:([^\r\n]*)/);
    if (statusMatch) grpcStatus = Number(statusMatch[1]);
    if (msgMatch) grpcMessage = msgMatch[1].trim();
  }
  return { payload, grpcStatus, grpcMessage };
}

interface ProtoReader {
  offset: number;
  buf: Buffer;
}

function readField(r: ProtoReader): { field: number; wire: number; bytes?: Buffer; varint?: number } | null {
  if (r.offset >= r.buf.length) return null;
  let tag = 0;
  let shift = 0;
  while (r.offset < r.buf.length) {
    const b = r.buf[r.offset++];
    tag |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7;
  }
  const field = tag >> 3;
  const wire = tag & 7;
  if (wire === 0) {
    let val = 0;
    shift = 0;
    while (r.offset < r.buf.length) {
      const b = r.buf[r.offset++];
      val |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) break;
      shift += 7;
    }
    return { field, wire, varint: val };
  }
  if (wire === 2) {
    let len = 0;
    shift = 0;
    while (r.offset < r.buf.length) {
      const b = r.buf[r.offset++];
      len |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) break;
      shift += 7;
    }
    const bytes = r.buf.subarray(r.offset, r.offset + len);
    r.offset += len;
    return { field, wire, bytes };
  }
  return { field, wire };
}

function decodeTokens(buf: Buffer): FoundationTokens {
  const r: ProtoReader = { offset: 0, buf };
  const out: FoundationTokens = { accessToken: "", refreshToken: "", expiresIn: 0 };
  for (;;) {
    const f = readField(r);
    if (!f) break;
    if (f.field === 1 && f.bytes) out.accessToken = f.bytes.toString("utf8");
    if (f.field === 2 && f.bytes) out.refreshToken = f.bytes.toString("utf8");
    if (f.field === 3 && f.varint !== undefined) out.expiresIn = f.varint;
  }
  return out;
}

function decodeClaims(buf: Buffer): FoundationClaims {
  const r: ProtoReader = { offset: 0, buf };
  const out: FoundationClaims = { subject: "", tenant_id: "", roles: [], issuer: "", audience: [], token_id: "" };
  for (;;) {
    const f = readField(r);
    if (!f) break;
    if (f.field === 1 && f.bytes) out.subject = f.bytes.toString("utf8");
    if (f.field === 2 && f.bytes) out.tenant_id = f.bytes.toString("utf8");
    if (f.field === 3 && f.bytes) out.roles.push(f.bytes.toString("utf8"));
    if (f.field === 4 && f.bytes) out.issuer = f.bytes.toString("utf8");
    if (f.field === 5 && f.bytes) out.audience.push(f.bytes.toString("utf8"));
    if (f.field === 6 && f.bytes) out.token_id = f.bytes.toString("utf8");
  }
  return out;
}

function decodeTenant(buf: Buffer): FoundationTenant {
  const r: ProtoReader = { offset: 0, buf };
  const out: FoundationTenant = { id: "", name: "", status: 0, created_at: "" };
  for (;;) {
    const f = readField(r);
    if (!f) break;
    if (f.field === 1 && f.bytes) out.id = f.bytes.toString("utf8");
    if (f.field === 2 && f.bytes) out.name = f.bytes.toString("utf8");
    if (f.field === 3 && f.varint !== undefined) out.status = f.varint;
    if (f.field === 5 && f.bytes) out.created_at = f.bytes.toString("utf8");
  }
  return out;
}

async function invoke(method: string, payload: Uint8Array, headers: Record<string, string> = {}): Promise<Buffer> {
  const url = `${endpoint()}/${FOUNDATION_SERVICE}/${method}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/grpc-web+proto",
        "x-grpc-web": "1",
        te: "trailers",
        ...headers,
      },
      body: new Uint8Array(frame(payload)),
    });
  } catch {
    throw new FoundationIdentityError(14, "foundation identity backend unavailable");
  }
  const body = Buffer.from(await response.arrayBuffer());
  const framed = readFrame(body);
  if (framed.grpcStatus !== 0) {
    throw new FoundationIdentityError(framed.grpcStatus, framed.grpcMessage || "foundation identity rpc failed");
  }
  return framed.payload;
}

export async function foundationAuthenticateUser(input: {
  tenant_name: string;
  principal_name: string;
  credential: string;
}): Promise<FoundationTokens> {
  const buf: number[] = [];
  appendString(buf, 1, input.tenant_name);
  appendString(buf, 2, input.principal_name);
  appendString(buf, 3, input.credential);
  const payload = await invoke("AuthenticateUser", Uint8Array.from(buf));
  return decodeTokens(payload);
}

export async function foundationValidateToken(accessToken: string): Promise<FoundationClaims> {
  const buf: number[] = [];
  appendString(buf, 1, accessToken);
  const payload = await invoke("ValidateToken", Uint8Array.from(buf));
  return decodeClaims(payload);
}

export async function foundationRefreshToken(refreshToken: string): Promise<FoundationTokens> {
  const buf: number[] = [];
  appendString(buf, 1, refreshToken);
  const payload = await invoke("RefreshToken", Uint8Array.from(buf));
  return decodeTokens(payload);
}

export async function foundationGetTenant(
  id: string,
  accessToken: string,
): Promise<FoundationTenant> {
  const buf: number[] = [];
  appendString(buf, 1, id);
  const payload = await invoke("GetTenant", Uint8Array.from(buf), {
    authorization: `Bearer ${accessToken}`,
  });
  return decodeTenant(payload);
}

export function mapFoundationError(err: unknown): { status: number; code: string; message: string } {
  if (err instanceof FoundationIdentityError) {
    if (err.grpcStatus === 3) return { status: 400, code: "INVALID_REQUEST", message: "Invalid authentication request" };
    if (err.grpcStatus === 7) return { status: 403, code: "FORBIDDEN", message: "tenant access denied" };
    if (err.grpcStatus === 16) return { status: 401, code: "UNAUTHENTICATED", message: "Authentication failed" };
    if (err.grpcStatus === 5) return { status: 404, code: "NOT_FOUND_OR_UNAUTHORIZED_RPC", message: "Not found" };
    if (err.grpcStatus === 14) return { status: 502, code: "BACKEND_SERVICE_FAILURE", message: "Identity backend unavailable" };
  }
  return { status: 502, code: "BACKEND_SERVICE_FAILURE", message: "Identity backend failure" };
}
