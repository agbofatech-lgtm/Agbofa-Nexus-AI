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

export const AuthoritativeBrandIdentity = {
  companyName: "Agbofa Technologies",
  productName: "Agbofa Nexus AI",
  tagline: "Autonomous AI Media Company Platform",
  title: "Agbofa Nexus AI — Autonomous AI Media Company Platform",
  description: "Enterprise autonomous AI media company platform that discovers, verifies, creates, packages, and distributes multi-channel content.",
  themeColor: "#0066CC",
  darkThemeColor: "#3399FF",
  aiAccentColor: "#6C5CE7",
  assets: {
    primaryLogo: "/brand/logo.svg",
    lightLogo: "/brand/logo-light.svg",
    darkLogo: "/brand/logo-dark.svg",
    mark: "/brand/mark.svg",
    favicon: "/favicon.svg",
    icon192: "/icons/icon-192.svg",
    icon512: "/icons/icon-512.svg",
    appleTouchIcon: "/icons/apple-touch-icon.svg",
    ogImage: "/og/default.svg",
    manifest: "/manifest.json",
  },
};
