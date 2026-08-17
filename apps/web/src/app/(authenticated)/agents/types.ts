/**
 * Agbofa Nexus AI — Platform Monitor Agent Dashboards Authoritative TypeScript Definitions (P0 Batch 10)
 * Defines types for the 32-agent workforce and in-depth telemetry for Monitor Agents (AGT-001 through AGT-008).
 */

export type AgentSquadType = "MONITORS" | "DETECTORS" | "VERIFICATION" | "PIPELINE";

export type AgentHealthStatusType =
  | "HEALTHY"
  | "DEGRADED"
  | "RATE_LIMITED"
  | "AUTH_FAILED"
  | "OFFLINE";

export interface AgentBase {
  agentId: string; // "AGT-001" to "AGT-032"
  name: string;
  squad: AgentSquadType;
  status: AgentHealthStatusType;
  version: string;
  uptime: number; // e.g. 99.98
  lastHealthCheck: string; // ISO 8601
}

export type MonitorPlatform =
  | "TWITTER"
  | "FACEBOOK"
  | "INSTAGRAM"
  | "TIKTOK"
  | "LINKEDIN"
  | "YOUTUBE"
  | "REDDIT"
  | "RSS";

export interface MonitorAgent extends AgentBase {
  platform: MonitorPlatform;
  signalsDetected24h: number;
  avgFetchLatencyMs: number;
  rateLimit: {
    used: number;
    total: number;
    resetTime: string; // ISO 8601 or formatted countdown string
  };
  apiStatus: "CONNECTED" | "DEGRADED" | "DISCONNECTED";
}

export type SignalType = "BREAKING" | "TREND" | "SENTIMENT" | "ENGAGEMENT";
export type SignalPriority = "C1" | "C2" | "C3";

export interface MonitorSignal {
  signalId: string;
  agentId: string;
  platform: string;
  detectedAt: string; // ISO 8601
  contentType: string; // e.g. "POST", "VIDEO_CAPTION", "ARTICLE_WIRE"
  contentPreview: string;
  signalType: SignalType;
  priority: SignalPriority;
}

export interface HourlyDataPoint {
  hour: string; // e.g. "00:00", "01:00"
  signals: number;
}

export interface TopKeyword {
  keyword: string;
  count: number;
  category: "ENTITY" | "TREND" | "TOPIC" | "LOCATION";
}

export interface QuotaHistoryPoint {
  timestamp: string; // time string
  usagePct: number; // 0 to 100
}
