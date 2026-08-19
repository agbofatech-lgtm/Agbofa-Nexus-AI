export type OperationTone =
  "blue" | "gold" | "green" | "purple" | "warning" | "error";
export type WorkflowStatus =
  | "queued"
  | "running"
  | "waiting"
  | "review"
  | "completed"
  | "failed"
  | "degraded"
  | "unavailable";
export interface OperationalMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: OperationTone;
}
export interface WorkflowStage {
  id: string;
  label: string;
  status: WorkflowStatus;
  count?: number;
  owner?: string;
  detail?: string;
}
export interface ActivityEvent {
  id: string;
  time: string;
  title: string;
  detail: string;
  status: WorkflowStatus;
  actor?: string;
}
export interface AIInsightData {
  title: string;
  summary: string;
  confidence: number;
  reasons: string[];
  recommendation: string;
  caveat: string;
}
