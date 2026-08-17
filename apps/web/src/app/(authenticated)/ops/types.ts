/**
 * Agbofa Nexus AI — Platform Operations Center Authoritative TypeScript Definitions (P0 Batch 9)
 * Defines types for service health, database status, AI Gateway status, 32-agent fleet telemetry,
 * pipeline throughput stages, and system alert ledgers.
 */

export type ServiceHealthStatus = "HEALTHY" | "DEGRADED" | "DOWN";

export interface ServiceHealthItem {
  id: string;
  name: string;
  status: ServiceHealthStatus;
  uptimePercentage: number;
  lastCheckedAt: string; // ISO 8601
  p95LatencyMs: number;
}

export type DatabaseHealthStatus = "CONNECTED" | "ERROR";

export interface DatabaseStatusItem {
  name: string;
  status: DatabaseHealthStatus;
  latencyMs?: number;
  migrationsStatus?: "UP_TO_DATE" | "BEHIND";
}

export type AIGatewayProviderStatus = "CONNECTED" | "DEGRADED" | "OFFLINE";

export interface AIGatewayProviderItem {
  name: "OpenAI" | "Anthropic" | "Google";
  status: AIGatewayProviderStatus;
  tokensUsedToday: number;
}

export type StorageTier = "GREEN" | "YELLOW" | "ORANGE" | "RED";

export interface InfrastructureHealthItem {
  workspaceSizeMb: number;
  fileCount: number;
  storageTier: StorageTier;
}

export type AgentSquad = "Monitors" | "Detectors" | "Verification" | "Pipeline";
export type AgentHealthStatus =
  | "HEALTHY"
  | "DEGRADED"
  | "RATE_LIMITED"
  | "AUTH_FAILED"
  | "OFFLINE";

export interface AgentExecutionItem {
  id: string;
  timestamp: string; // ISO 8601
  status: "SUCCESS" | "FAILED" | "RETRYING";
  latencyMs: number;
}

export interface AgentErrorLogItem {
  timestamp: string; // ISO 8601
  message: string;
}

export interface AgentFleetItem {
  id: string; // "AGT-001" to "AGT-032"
  name: string;
  squad: AgentSquad;
  status: AgentHealthStatus;
  uptimePercentage: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRate24h: number; // percentage e.g. 0.05
  tokensUsedToday: number;
  rateLimitRemaining: number;
  rateLimitTotal: number;
  lastCheckedAt: string;
  recentExecutions: AgentExecutionItem[];
  errorLog: AgentErrorLogItem[];
}

export type PipelineStageId =
  | "SIGNALS"
  | "DETECTIONS"
  | "VERIFICATIONS"
  | "ROUTING"
  | "DISTRIBUTION";

export interface PipelineStageMetric {
  stageId: PipelineStageId;
  label: string;
  itemsPerHour: number;
  queueDepth: number;
  avgProcessingTimeMs: number;
  isBottleneck: boolean;
}

export type PipelineOverallHealth = "FLOWING" | "BOTTLENECKED" | "STALLED";

export interface PipelineThroughputSummary {
  health: PipelineOverallHealth;
  signalsDetected24h: number;
  storiesVerified24h: number;
  packagesDistributed24h: number;
  avgEndToEndLatencySeconds: number;
}

export type AlertSeverity = "CRITICAL" | "WARNING" | "INFO";
export type AlertType =
  | "AGENT_OFFLINE"
  | "RATE_LIMIT"
  | "ACCURACY_DEGRADATION"
  | "RLS_BYPASS"
  | "PIPELINE_STALL";
export type AlertStatus = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";

export interface AlertHistoryItem {
  id: string;
  severity: AlertSeverity;
  type: AlertType;
  message: string;
  affectedServiceOrAgent: string;
  occurredAt: string; // ISO 8601
  status: AlertStatus;
  resolutionNotes?: string;
  timeline?: Array<{
    timestamp: string;
    event: string;
  }>;
}

export interface OpsDashboardStats {
  systemHealth: ServiceHealthStatus;
  systemUptimePercentage: number;
  healthyAgentsCount: number;
  totalAgentsCount: number;
  pipelineThroughputPerHour: number;
  criticalAlertsCount: number;
  warningAlertsCount: number;
}
