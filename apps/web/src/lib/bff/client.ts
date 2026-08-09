/**
 * Agbofa Nexus AI — Client-Side BFF API Client (P0 Batch 2)
 * Universal browser HTTP client calling Next.js BFF proxy routes (/api/rpc/...).
 * NEVER imports @grpc/grpc-js into client components.
 * Automatically injects CSRF headers, correlation IDs, and tenant context.
 */

import { defaultNexusConfig } from "@agbofa/config";
import { generateCorrelationId } from "@agbofa/utils";
import { CSRF_HEADER_NAME } from "../auth/session";

export type NormalizedErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND_OR_UNAUTHORIZED_RPC"
  | "INVALID_REQUEST"
  | "RATE_LIMITED"
  | "BACKEND_SERVICE_FAILURE"
  | "NETWORK_ERROR";

export interface BffErrorEnvelope {
  code: NormalizedErrorCode;
  status: number;
  message: string;
  correlationId: string;
  service?: string;
  method?: string;
}

export interface BffResponseEnvelope<T> {
  data?: T;
  error?: BffErrorEnvelope;
  status: "SUCCESS" | "ERROR";
  correlationId: string;
  timestamp: string;
}

export interface BffRequestOptions {
  tenantId?: string;
  csrfToken?: string;
  correlationId?: string;
  signal?: AbortSignal;
}

export function mapHttpStatusToErrorCode(status: number): NormalizedErrorCode {
  if (status === 401) return "UNAUTHENTICATED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND_OR_UNAUTHORIZED_RPC";
  if (status === 400 || status === 422) return "INVALID_REQUEST";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "BACKEND_SERVICE_FAILURE";
  return "BACKEND_SERVICE_FAILURE";
}

/**
 * Universal browser client for calling authorized Go gRPC services through Next.js BFF.
 */
export async function callRpc<TRequest, TResponse>(
  serviceName: string,
  methodName: string,
  payload: TRequest,
  options: BffRequestOptions = {},
): Promise<BffResponseEnvelope<TResponse>> {
  const correlationId = options.correlationId || generateCorrelationId();
  const tenantId = options.tenantId || defaultNexusConfig.defaultTenantId;
  const url = `${defaultNexusConfig.apiBaseUrl}/rpc/${encodeURIComponent(serviceName)}/${encodeURIComponent(methodName)}`;

  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-correlation-id": correlationId,
    "x-tenant-id": tenantId,
  };

  if (options.csrfToken) {
    headers[CSRF_HEADER_NAME] = options.csrfToken;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload ?? {}),
      credentials: "include",
      signal: options.signal,
    });

    const timestamp = new Date().toISOString();

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorBody = await response.json();
        if (errorBody?.error?.message) {
          errorMessage = errorBody.error.message;
        } else if (errorBody?.message) {
          errorMessage = errorBody.message;
        }
      } catch {
        // Ignore json parse error on non-json error responses
      }

      const errorCode = mapHttpStatusToErrorCode(response.status);

      return {
        status: "ERROR",
        error: {
          code: errorCode,
          status: response.status,
          message: errorMessage,
          correlationId,
          service: serviceName,
          method: methodName,
        },
        correlationId,
        timestamp,
      };
    }

    const data = (await response.json()) as TResponse;
    return {
      status: "SUCCESS",
      data,
      correlationId,
      timestamp,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error contacting BFF endpoint";
    return {
      status: "ERROR",
      error: {
        code: "NETWORK_ERROR",
        status: 0,
        message,
        correlationId,
        service: serviceName,
        method: methodName,
      },
      correlationId,
      timestamp: new Date().toISOString(),
    };
  }
}
