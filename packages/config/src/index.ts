/**
 * Agbofa Nexus AI — Frontend Configuration (IMP-014, SVC-167)
 * Authoritative configuration for API endpoints (API-001–004, API-037), tenant defaults, and environment controls.
 */

export interface NexusAppConfig {
  appName: string;
  apiBaseUrl: string; // API-001 REST API
  graphqlUrl: string; // API-002 GraphQL API
  websocketUrl: string; // API-003 WebSocket API
  sseUrl: string; // API-004 Server-Sent Events API
  defaultTenantId: string;
  enablePWA: boolean; // SVC-172
  enableOfflineCache: boolean; // SVC-172
}

export const defaultNexusConfig: NexusAppConfig = {
  appName: "Agbofa Nexus AI",
  apiBaseUrl: "/api/v1",
  graphqlUrl: "/graphql",
  websocketUrl: "wss://api.agbofa.local/ws",
  sseUrl: "/api/v1/events/stream",
  defaultTenantId: "tenant-default",
  enablePWA: true,
  enableOfflineCache: true,
};
