export type AgentStatus =
  "running" | "idle" | "queued" | "degraded" | "failed" | "disabled";

export type AgentCategory =
  | "content"
  | "verification"
  | "distribution"
  | "analytics"
  | "monetisation"
  | "platform";

export type AgentImplementationStatus =
  "not_started" | "in_progress" | "completed";

export type AgentHealthFilter = "all" | "healthy" | "warning" | "critical";

export interface AgentTask {
  id: string;
  title: string;
  progress: number;
  startedAt: Date;
  estimatedDurationSeconds: number;
  simulated: true;
}

export interface AgentExecution {
  id: string;
  startedAt: Date;
  durationMs: number;
  status: "success" | "warning" | "failure";
  summary: string;
  simulated: true;
}

export interface AgentTelemetryPoint {
  at: Date;
  value: number;
}

export interface AgentTelemetry {
  throughput: AgentTelemetryPoint[];
  latency: AgentTelemetryPoint[];
  successRate: AgentTelemetryPoint[];
  queue: AgentTelemetryPoint[];
  mode: "simulated";
}

export interface AgentDependencies {
  input: string[];
  output: string[];
  provenance: "simulated";
}

export interface Agent {
  id: string;
  name: string;
  category: AgentCategory;
  description: string;
  status: AgentStatus;
  health: number;
  queue: number;
  throughput: number;
  latency: number;
  successRate: number;
  currentTask?: AgentTask;
  lastExecution?: AgentExecution;
  executions: AgentExecution[];
  dependencies: AgentDependencies;
  telemetry: AgentTelemetry;
  implementationStatus: AgentImplementationStatus;
  registryStatus: string;
  sourceReference: string;
}

export interface AgentFilters {
  category: AgentCategory | "all";
  status: AgentStatus | "all";
  health: AgentHealthFilter;
  search: string;
}

export interface AgentSummary {
  total: number;
  running: number;
  averageHealth: number;
  attention: number;
}
