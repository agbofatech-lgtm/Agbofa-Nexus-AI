import type { WorkflowStage } from "@/types/operations";

export type ProviderState =
  "development" | "connected" | "degraded" | "offline" | "not-configured";

export interface AIModel {
  id: string;
  name: string;
  capability: string;
  contextWindow: string;
  availability: "available" | "limited" | "unavailable";
}

export interface AIProvider {
  id: "gemini" | "openai" | "anthropic";
  name: string;
  state: ProviderState;
  latency: number;
  errorRate: number;
  requestCount: number;
  tokenUsage: number;
  estimatedCost: number;
  health: number;
  fallbackState: string;
  models: AIModel[];
  mode: "demo";
}

export interface AIControlData {
  workflow: WorkflowStage[];
  providers: AIProvider[];
  totalRequests: number;
  totalTokens: number;
  estimatedCost: number;
  averageHealth: number;
  mode: "demo";
  dataStatus: "partial";
}
