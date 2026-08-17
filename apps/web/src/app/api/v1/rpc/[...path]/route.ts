/**
 * BFF RPC route alias for /api/v1/rpc/[service]/[method].
 * Re-exports the authoritative /api/rpc/[...path] handler.
 */

export { POST, GET } from "../../../rpc/[...path]/route";