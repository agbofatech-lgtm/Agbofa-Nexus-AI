/**
 * Agbofa Nexus AI — AI Control Center Authoritative TypeScript Definitions (P0 Batch 8)
 * Defines types for AI model routing, provider configuration, prompt registry,
 * token quotas, and 32-agent fleet usage ledgers.
 */

export type ProviderName = "OpenAI" | "Anthropic" | "Google" | "Custom";
export type ModelStatus = "ACTIVE" | "DEGRADED" | "OFFLINE";
export type TaskType =
  | "summarization"
  | "fact-check"
  | "sentiment"
  | "vision"
  | "audio";

export interface AIModelConfig {
  id: string;
  name: string;
  version: string;
  provider: ProviderName;
  status: ModelStatus;
  contextWindow: number; // e.g. 128000
  temperature: number; // e.g. 0.2
  maxTokens: number; // e.g. 4096
  defaultForTasks: TaskType[];
  fallbackOrder: number; // 1 = Primary, 2 = Secondary, 3 = Fallback
  costPer1kInput: number; // USD
  costPer1kOutput: number; // USD
}

export type PromptStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface PromptVariable {
  name: string;
  description: string;
  defaultValue?: string;
}

export interface PromptVersionHistory {
  version: string;
  updatedAt: string; // ISO 8601
  updatedBy: string;
  changeNote: string;
}

export interface PromptTemplateItem {
  id: string;
  name: string;
  description: string;
  version: string;
  associatedAgents: string[]; // e.g. ["AGT-017", "AGT-018"]
  taskType: TaskType;
  templateText: string;
  variables: PromptVariable[];
  status: PromptStatus;
  updatedAt: string; // ISO 8601
  history: PromptVersionHistory[];
}

export type QuotaLimitStatus = "OK" | "WARNING" | "EXCEEDED";
export type AgentSquad = "Monitors" | "Detectors" | "Verification" | "Pipeline";

export interface AgentQuotaItem {
  agentId: string; // e.g. "AGT-001"
  agentName: string;
  squad: AgentSquad;
  tokensUsedToday: number;
  dailyTokenLimit: number;
  rateLimitStatus: QuotaLimitStatus;
  estimatedCostUsd: number;
}

export interface ProviderUsageItem {
  provider: ProviderName;
  tokensUsedToday: number;
  percentageOfTotal: number;
  costUsd: number;
}

export interface DailyUsageTrendItem {
  date: string;
  tokens: number;
  costUsd: number;
}

export interface SquadUsageItem {
  squad: AgentSquad;
  tokensUsedToday: number;
  percentageOfTotal: number;
  costUsd: number;
}

export interface AIControlDashboardStats {
  activeModelsCount: number;
  totalPromptsCount: number;
  tokensUsedToday: number;
  dailyTokenLimit: number;
  tokenUsagePercentage: number;
  fleetHealthStatus: "HEALTHY" | "DEGRADED";
  healthyAgentsCount: number;
  totalAgentsCount: number;
  estimatedDailyCostUsd: number;
}

export interface AIRoutingActivityEvent {
  id: string;
  timestamp: string; // ISO 8601
  agentId: string;
  modelUsed: string;
  provider: ProviderName;
  taskType: TaskType;
  latencyMs: number;
  tokensConsumed: number;
  fallbackTriggered: boolean;
}
