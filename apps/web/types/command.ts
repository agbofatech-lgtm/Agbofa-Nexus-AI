import type { OperationalMetric, WorkflowStage } from "@/types/operations";

export type CommandMetricTone = "gold" | "blue" | "green" | "purple";
export type CommandMetricId = "agents" | "stories" | "confidence" | "reach";
export type CommandActivityTone = "green" | "gold" | "blue";
export type CommandActivityId = "verified" | "agent" | "audience";

export interface CommandMetric {
  id: CommandMetricId;
  label: string;
  value: string;
  context: string;
  tone: CommandMetricTone;
}

export interface CommandActivity {
  id: CommandActivityId;
  title: string;
  detail: string;
  timeLabel: string;
  tone: CommandActivityTone;
}

export interface CommandPrioritySignal {
  label: string;
  status: "verified-demo" | "confidence-demo" | "queued-demo";
  value: string;
}

export interface CommandOverviewData {
  dataAuthority: "DEMO";
  generatedAt: null;
  metrics: CommandMetric[];
  activity: CommandActivity[];
  signals: CommandPrioritySignal[];
  operations: OperationalMetric[];
  workflow: WorkflowStage[];
  network: {
    registeredAgents: number;
    simulatedConnectedAgents: number;
    exampleEventsPerMinute: number;
    exampleConfidence: number;
  };
}
