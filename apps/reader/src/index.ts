/**
 * Agbofa Nexus AI — Reader / AI Workspace Shell Foundation (IMP-014, SVC-174)
 * Authoritative shell for audience consumption, AI interaction, and telemetry integration.
 */

import { defaultNexusConfig } from "../../../packages/config/src/index.ts";
import { MockNexusApiClient, AnalyticsEventPayload } from "../../../packages/api-client/src/index.ts";

export interface ReaderWorkspaceConfig {
  tenantId: string;
  enableTelemetry: boolean;
  viewportBreakpoint: "mobile" | "tablet" | "desktop";
}

export function initializeReaderWorkspace(tenantId: string): ReaderWorkspaceConfig {
  const targetTenant = tenantId || defaultNexusConfig.defaultTenantId;
  return {
    tenantId: targetTenant,
    enableTelemetry: true,
    viewportBreakpoint: "desktop",
  };
}

export async function emitPageViewTelemetry(tenantId: string, storyId: string): Promise<boolean> {
  const client = new MockNexusApiClient(tenantId);
  const payload: AnalyticsEventPayload = {
    tenantId,
    eventType: "PAGE_VIEW",
    storyId,
    channelId: "WEB_READER",
    category: "OBSERVED_DATA",
    properties: { shell: "reader-workspace" },
  };
  const resp = await client.emitTelemetry(payload);
  return resp.status === "SUCCESS";
}
