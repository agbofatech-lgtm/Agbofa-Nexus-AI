/**
 * Agbofa Nexus AI — Frontend API Client Foundation (IMP-014, SVC-169, API-001–004, API-037)
 * Authoritative client contracts, request/response models, and error envelopes.
 */

export type RequestStatus = "IDLE" | "LOADING" | "SUCCESS" | "EMPTY" | "ERROR" | "UNAUTHORIZED";

export interface ApiErrorEnvelope {
  code: string;
  message: string;
  tenantId: string;
  correlationId: string;
}

export interface ApiResponseEnvelope<T> {
  data?: T;
  error?: ApiErrorEnvelope;
  status: RequestStatus;
  timestamp: string;
}

export interface StorySummaryModel {
  storyId: string;
  tenantId: string;
  title: string;
  summary: string;
  status: string;
  confidenceScore: number;
}

export interface AnalyticsEventPayload {
  tenantId: string;
  eventType: string;
  storyId: string;
  channelId: string;
  category: "OBSERVED_DATA" | "DERIVED_METRICS" | "INFERRED_SIGNALS" | "AI_GENERATED_INSIGHTS";
  properties: Record<string, string>;
}

export interface ApiClientInterface {
  getStories(tenantId: string): Promise<ApiResponseEnvelope<StorySummaryModel[]>>;
  emitTelemetry(event: AnalyticsEventPayload): Promise<ApiResponseEnvelope<{ success: boolean }>>;
}

export class MockNexusApiClient implements ApiClientInterface {
  constructor(private readonly baseTenantId: string) {}

  async getStories(tenantId: string): Promise<ApiResponseEnvelope<StorySummaryModel[]>> {
    if (!tenantId) {
      return {
        status: "UNAUTHORIZED",
        error: { code: "CROSS_TENANT_VIOLATION", message: "tenant_id required", tenantId: "", correlationId: "corr-err" },
        timestamp: new Date().toISOString(),
      };
    }
    return {
      status: "SUCCESS",
      data: [
        {
          storyId: "story-100",
          tenantId,
          title: "AI Media Platform Scales",
          summary: "Frontend foundation deployed successfully.",
          status: "VERIFIED",
          confidenceScore: 0.95,
        },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  async emitTelemetry(event: AnalyticsEventPayload): Promise<ApiResponseEnvelope<{ success: boolean }>> {
    return {
      status: "SUCCESS",
      data: { success: true },
      timestamp: new Date().toISOString(),
    };
  }
}
