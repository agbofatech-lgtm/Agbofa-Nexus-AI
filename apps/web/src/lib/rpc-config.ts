import { NextResponse } from "next/server";

// Authoritative P0 RPC Allowlist Matrix (Gate H)
export const P0_RPC_ALLOWLIST = new Set<string>([
  // TenantIdentityService
  "foundation.v1.TenantIdentityService/AuthenticateUser",
  "TenantIdentityService/AuthenticateUser",
  "foundation.v1.TenantIdentityService/ValidateToken",
  "TenantIdentityService/ValidateToken",
  "foundation.v1.TenantIdentityService/GetTenant",
  "TenantIdentityService/GetTenant",
  "foundation.v1.TenantIdentityService/RefreshToken",
  "TenantIdentityService/RefreshToken",
  // AuthorizationService
  "foundation.v1.AuthorizationService/CheckPermission",
  "AuthorizationService/CheckPermission",
  // AIGatewayService
  "runtime.v1.AIGatewayService/InvokeModel",
  "AIGatewayService/InvokeModel",
  // ContentOriginationService
  "content_origination.v1.ContentOriginationService/CreateOriginationStory",
  "ContentOriginationService/CreateOriginationStory",
  "content_origination.v1.ContentOriginationService/UpdateStoryState",
  "ContentOriginationService/UpdateStoryState",
  "content_origination.v1.ContentOriginationService/ListSources",
  "ContentOriginationService/ListSources",
  // IngestionService
  "content_origination.v1.IngestionService/IngestSource",
  "IngestionService/IngestSource",
  "content_origination.v1.IngestionService/GetIngestJob",
  "IngestionService/GetIngestJob",
  "content_origination.v1.IngestionService/ListSources",
  "IngestionService/ListSources",
  // ContentFactoryService
  "content_factory.v1.ContentFactoryService/CreatePackage",
  "ContentFactoryService/CreatePackage",
  "content_factory.v1.ContentFactoryService/GetPackage",
  "ContentFactoryService/GetPackage",
  "content_factory.v1.ContentFactoryService/ListPackages",
  "ContentFactoryService/ListPackages",
  "content_factory.v1.ContentFactoryService/SubmitForReview",
  "ContentFactoryService/SubmitForReview",
  "content_factory.v1.ContentFactoryService/ReviewPackage",
  "ContentFactoryService/ReviewPackage",
]);

export function isRpcAllowed(serviceName: string, methodName: string): boolean {
  const full = `${serviceName}/${methodName}`;
  return (
    P0_RPC_ALLOWLIST.has(full) ||
    P0_RPC_ALLOWLIST.has(`${serviceName.split(".").pop()}/${methodName}`)
  );
}

export function buildNormalizedError(
  status: number,
  code: string,
  message: string,
  correlationId: string,
): NextResponse {
  return NextResponse.json(
    {
      status: "ERROR",
      error: {
        code,
        status,
        message,
        correlation_id: correlationId,
        details: {},
      },
    },
    { status },
  );
}
