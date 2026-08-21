/** Phase 07 controlled-autonomy types. Production autonomy is disabled by default. */

export type Maturity = "DECLARED" | "IMPLEMENTED" | "EXECUTABLE" | "CERTIFIED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type ExecutionStatus =
  | "PENDING"
  | "RUNNING"
  | "WAITING"
  | "WAITING_APPROVAL"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "TIMED_OUT"
  | "BLOCKED";

export type PolicyVerdict = "ALLOW" | "DENY" | "REQUIRE_HUMAN_APPROVAL" | "BLOCKED" | "THROTTLED";

export type GateStatus = "unknown" | "passed" | "failed" | "skipped";

export interface Actor {
  subjectId: string;
  tenantId: string;
  roles: string[];
}

export interface JsonSchema {
  type: string;
  required?: string[];
  properties?: Record<string, { type: string }>;
}

export interface AgentSpec {
  id: string;
  name: string;
  purpose: string;
  category: string;
  capabilities: string[];
  tools: string[];
  permissions: string[];
  riskLevel: RiskLevel;
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
  modelProvider: string;
  executionPolicy: string;
  approvalRequired: boolean;
  tenantScope: "caller";
  enabled: boolean;
  implementation: "DECLARED" | "IMPLEMENTED";
  certified: false;
}

export interface ToolSpec {
  id: string;
  name: string;
  description: string;
  version: string;
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
  permissions: string[];
  tenantScope: "caller";
  riskLevel: RiskLevel;
  sideEffects: string[];
  approvalRequired: boolean;
  auditRequired: boolean;
  timeoutMs: number;
  rateLimitPerMinute: number;
  implemented: boolean;
  phase04Only?: boolean;
}

export interface ContentGates {
  truth: GateStatus;
  compliance: GateStatus;
  brand: GateStatus;
}

export interface PolicyInput {
  tenantId: string;
  actor: Actor;
  agentId: string;
  toolId: string;
  action: string;
  target?: string;
  risk: RiskLevel;
  content: ContentGates;
  approvalId?: string;
  budgetRemaining: number;
  killSwitch: "ARMED" | "ENGAGED";
  domainLevel: number;
  productionAutonomy: boolean;
}

export interface PolicyDecision {
  verdict: PolicyVerdict;
  code: string;
  reason: string;
  at: string;
}

export interface ApprovalRecord {
  id: string;
  tenantId: string;
  executionId: string;
  workflowId: string;
  requestedAction: string;
  target: string;
  riskLevel: RiskLevel;
  requestingAgent: string;
  requestingActor: string;
  approvingActor: string;
  timestamp: string;
  decidedAt?: string;
  decision: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED";
  reason: string;
  actionFingerprint: string;
  expiresAt: string;
}

export interface ToolCallRecord {
  id: string;
  toolId: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  policy: PolicyDecision;
  error?: string;
  at: string;
}

export interface ExecutionRecord {
  id: string;
  workflowId: string;
  agentId: string;
  tenantId: string;
  actorId: string;
  correlationId: string;
  status: ExecutionStatus;
  startTime: string;
  endTime?: string;
  timeoutMs: number;
  result?: Record<string, unknown>;
  error?: string;
  toolCalls: ToolCallRecord[];
  policyDecisions: PolicyDecision[];
  depth: number;
  idempotencyKey?: string;
}

export interface MemoryRecord {
  id: string;
  tenantId: string;
  agentId: string;
  actorId: string;
  text: string;
  createdAt: string;
  deleted: boolean;
}

export interface AuditEvent {
  at: string;
  tenantId: string;
  actorId: string;
  agentId?: string;
  executionId?: string;
  workflowId?: string;
  toolId?: string;
  action: string;
  policy?: PolicyDecision;
  approvalId?: string;
  result: string;
  error?: string;
  correlationId: string;
}

export const FORBIDDEN_TOOLS = [
  "raw_oauth_token",
  "direct_database",
  "shell_exec",
  "direct_social_api",
  "bypass_policy",
  "bypass_approval",
  "bypass_truth",
  "bypass_compliance",
  "bypass_brand",
  "bypass_phase04",
] as const;
