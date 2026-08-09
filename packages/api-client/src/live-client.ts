/**
 * Agbofa Nexus AI — Live Frontend API Client (IMP-014, SVC-169)
 * Makes live network requests to Next.js BFF endpoints (/api/rpc/...) over HTTP/JSON.
 * NEVER falls back to mock data.
 */

import {
  ApiClientInterface,
  ApiResponseEnvelope,
  AnalyticsEventPayload,
  StorySummaryModel,
} from "./index";

function generateCorrelationId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "corr-" + Math.random().toString(36).substring(2, 11);
}

export class LiveNexusApiClient implements ApiClientInterface {
  constructor(
    private readonly baseTenantId: string,
    private readonly baseUrl: string = "/api/rpc"
  ) {}

  private async request<T>(
    service: string,
    method: string,
    payload: Record<string, any>
  ): Promise<ApiResponseEnvelope<T>> {
    const correlationId = generateCorrelationId();
    const targetUrl = `${this.baseUrl}/${service}/${method}`;

    try {
      const resp = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-correlation-id": correlationId,
          "x-tenant-id": this.baseTenantId,
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        if (resp.status === 401) {
          return {
            status: "UNAUTHORIZED",
            error: {
              code: "UNAUTHORIZED",
              message: "Authentication required",
              tenantId: this.baseTenantId,
              correlationId,
            },
            timestamp: new Date().toISOString(),
          };
        }
        return {
          status: "ERROR",
          error: {
            code: `HTTP_${resp.status}`,
            message: `Request failed with status ${resp.status}`,
            tenantId: this.baseTenantId,
            correlationId,
          },
          timestamp: new Date().toISOString(),
        };
      }

      const envelope: ApiResponseEnvelope<T> = await resp.json();
      return envelope;
    } catch (err: any) {
      return {
        status: "ERROR",
        error: {
          code: "NETWORK_ERROR",
          message: err?.message || "Network request failed",
          tenantId: this.baseTenantId,
          correlationId,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getStories(
    tenantId: string
  ): Promise<ApiResponseEnvelope<StorySummaryModel[]>> {
    const targetTenant = tenantId || this.baseTenantId;
    if (!targetTenant) {
      return {
        status: "UNAUTHORIZED",
        error: {
          code: "CROSS_TENANT_VIOLATION",
          message: "tenant_id required",
          tenantId: "",
          correlationId: generateCorrelationId(),
        },
        timestamp: new Date().toISOString(),
      };
    }

    return this.request<StorySummaryModel[]>(
      "content_origination.ContentOriginationService",
      "ListOriginationStories",
      { tenant_id: targetTenant }
    );
  }

  async emitTelemetry(
    event: AnalyticsEventPayload
  ): Promise<ApiResponseEnvelope<{ success: boolean }>> {
    return this.request<{ success: boolean }>(
      "analytics.AnalyticsEventService",
      "CollectEvent",
      event
    );
  }
}
