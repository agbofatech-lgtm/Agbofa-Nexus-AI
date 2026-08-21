import { createHash, randomUUID } from "node:crypto";
import { canonicalAgents, canonicalTools } from "./catalog.ts";
import { FORBIDDEN_TOOLS, type Actor, type AgentSpec, type ApprovalRecord, type AuditEvent, type ContentGates, type ExecutionRecord, type ExecutionStatus, type MemoryRecord, type PolicyDecision, type PolicyInput, type RiskLevel, type ToolCallRecord, type ToolSpec } from "./types.ts";

export class ControlError extends Error {
  readonly code: string;
  readonly http: number;
  constructor(code: string, message: string, http = 403) {
    super(message);
    this.name = "ControlError";
    this.code = code;
    this.http = http;
  }
}

export interface Phase04Request {
  tenantId: string;
  actorId: string;
  contentId: string;
  contentVersion: string;
  body: string;
  brandApplied: boolean;
  connectionId: string;
  mediaUrl?: string;
  approved: boolean;
}

export interface Phase04Result {
  jobId: string;
  status: string;
  providerCalled: false;
}

export interface PlanePorts {
  phase04?: {
    schedule(req: Phase04Request): Promise<Phase04Result>;
  };
  truth?: { validate(text: string): Promise<boolean> };
  compliance?: { check(text: string): Promise<boolean> };
  analytics?: { read(tenantId: string): Promise<Record<string, unknown>> };
  llm?: { complete(prompt: string): Promise<{ text: string; tokens: number }> };
}

export interface PlaneOptions {
  productionAutonomy?: boolean;
  now?: () => number;
  maxConcurrentPerTenant?: number;
  maxDepth?: number;
  maxSteps?: number;
  defaultTimeoutMs?: number;
  memoryLimitPerTenant?: number;
  budgetPerTenant?: number;
  ratePerMinute?: number;
  ports?: PlanePorts;
}

const TERMINAL: ExecutionStatus[] = ["SUCCEEDED", "FAILED", "CANCELLED", "TIMED_OUT", "BLOCKED"];

function canControl(actor: Actor): boolean {
  return actor.roles.some((r) => ["TENANT_OWNER", "TENANT_ADMIN", "owner", "admin"].includes(r));
}

function canExecute(actor: Actor): boolean {
  return actor.roles.some((r) =>
    ["TENANT_OWNER", "TENANT_ADMIN", "EDITOR", "owner", "admin", "editor"].includes(r),
  );
}

function fingerprint(action: string, target: string, extra: string): string {
  return createHash("sha256").update(`${action}|${target}|${extra}`).digest("hex").slice(0, 32);
}

function redact(value: unknown): unknown {
  const raw = JSON.stringify(value);
  if (!raw) return value;
  const cleaned = raw
    .replace(/("?(?:access_token|refresh_token|password|credential|authorization|api_key|secret)"?\s*:\s*")[^"]*"/gi, '$1[REDACTED]"')
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, "Bearer [REDACTED]");
  try {
    return JSON.parse(cleaned);
  } catch {
    return { redacted: true };
  }
}

export class ControlPlane {
  readonly productionAutonomy: boolean;
  private readonly now: () => number;
  private readonly maxConcurrent: number;
  private readonly maxDepth: number;
  private readonly maxSteps: number;
  private readonly defaultTimeoutMs: number;
  private readonly memoryLimit: number;
  private readonly budgetLimit: number;
  private readonly ratePerMinute: number;
  private readonly ports: PlanePorts;

  private readonly agents = new Map<string, AgentSpec>();
  private readonly tools = new Map<string, ToolSpec>();
  private readonly tenantEnabled = new Map<string, Set<string>>();
  private readonly kill = new Map<string, "ARMED" | "ENGAGED">();
  private readonly domainLevel = new Map<string, number>();
  private readonly executions = new Map<string, ExecutionRecord>();
  private readonly byIdempotency = new Map<string, string>();
  private readonly approvals = new Map<string, ApprovalRecord>();
  private readonly memories: MemoryRecord[] = [];
  private readonly auditLog: AuditEvent[] = [];
  private readonly spend = new Map<string, number>();
  private readonly rateBuckets = new Map<string, number[]>();
  private readonly running = new Map<string, number>();
  private readonly cancels = new Set<string>();

  constructor(opts: PlaneOptions = {}) {
    this.productionAutonomy = opts.productionAutonomy === true;
    this.now = opts.now ?? Date.now;
    this.maxConcurrent = opts.maxConcurrentPerTenant ?? 2;
    this.maxDepth = opts.maxDepth ?? 1;
    this.maxSteps = opts.maxSteps ?? 16;
    this.defaultTimeoutMs = opts.defaultTimeoutMs ?? 5000;
    this.memoryLimit = opts.memoryLimitPerTenant ?? 32;
    this.budgetLimit = opts.budgetPerTenant ?? 100_000;
    this.ratePerMinute = opts.ratePerMinute ?? 20;
    this.ports = opts.ports ?? {};
    for (const a of canonicalAgents()) this.agents.set(a.id, { ...a });
    for (const t of canonicalTools()) this.tools.set(t.id, { ...t });
  }

  listAgents(): AgentSpec[] {
    return [...this.agents.values()].map((a) => ({ ...a }));
  }

  getAgent(id: string): AgentSpec | undefined {
    const a = this.agents.get(id);
    return a ? { ...a } : undefined;
  }

  uniqueIds(): boolean {
    return this.agents.size === canonicalAgents().length;
  }

  setKill(tenantId: string, actor: Actor, engaged: boolean): void {
    if (!canControl(actor) || actor.tenantId !== tenantId) {
      throw new ControlError("DENIED", "unauthorized kill-switch mutation");
    }
    this.kill.set(tenantId, engaged ? "ENGAGED" : "ARMED");
    this.audit({ tenantId, actorId: actor.subjectId, action: "KILL_SWITCH", result: engaged ? "ENGAGED" : "ARMED", correlationId: "" });
    if (engaged) {
      for (const ex of this.executions.values()) {
        if (ex.tenantId !== tenantId) continue;
        if (ex.status === "RUNNING" || ex.status === "PENDING" || ex.status === "WAITING") {
          this.transition(ex, "BLOCKED");
          ex.error = "KILL_SWITCH_ENGAGED";
          ex.endTime = new Date(this.now()).toISOString();
        }
      }
    }
  }

  getKill(tenantId: string): "ARMED" | "ENGAGED" {
    return this.kill.get(tenantId) ?? "ARMED";
  }

  setDomainLevel(tenantId: string, actor: Actor, level: number): void {
    if (!canControl(actor) || actor.tenantId !== tenantId) throw new ControlError("DENIED", "unauthorized level mutation");
    this.domainLevel.set(tenantId, Math.max(0, Math.min(5, level)));
  }

  enableAgent(tenantId: string, agentId: string, actor: Actor): void {
    if (!canControl(actor) || actor.tenantId !== tenantId) throw new ControlError("UNAUTHORIZED_AGENT", "unauthorized enable");
    const spec = this.agents.get(agentId);
    if (!spec) throw new ControlError("INVALID_AGENT", "unknown agent");
    let set = this.tenantEnabled.get(tenantId);
    if (!set) {
      set = new Set();
      this.tenantEnabled.set(tenantId, set);
    }
    set.add(agentId);
  }

  resolve(agentId: string, actor: Actor): { spec: AgentSpec; maturity: "DECLARED" | "IMPLEMENTED" | "EXECUTABLE"; code?: string } {
    if (!actor.subjectId || !actor.tenantId) {
      throw new ControlError("DENIED", "missing actor/tenant");
    }
    const spec = this.agents.get(agentId);
    if (!spec) throw new ControlError("INVALID_AGENT", "unknown agent");
    if (spec.implementation !== "IMPLEMENTED") {
      throw new ControlError("INVALID_AGENT", "agent is DECLARED but not IMPLEMENTED");
    }
    if (!this.tenantEnabled.get(actor.tenantId)?.has(agentId)) {
      throw new ControlError("DISABLED_AGENT", "agent is disabled for tenant");
    }
    if (!canExecute(actor)) {
      throw new ControlError("UNAUTHORIZED_AGENT", "actor cannot execute agents");
    }
    return { spec, maturity: "EXECUTABLE" };
  }

  decide(input: PolicyInput): PolicyDecision {
    const at = new Date(this.now()).toISOString();
    const deny = (code: string, reason: string, verdict: PolicyDecision["verdict"] = "DENY"): PolicyDecision => ({
      verdict,
      code,
      reason,
      at,
    });
    if (input.killSwitch === "ENGAGED") return deny("KILL_SWITCH_ENGAGED", "kill switch engaged", "BLOCKED");
    if (!input.actor.subjectId || input.actor.tenantId !== input.tenantId) {
      return deny("TENANT_MISMATCH", "actor tenant mismatch");
    }
    if (FORBIDDEN_TOOLS.includes(input.toolId as (typeof FORBIDDEN_TOOLS)[number])) {
      return deny("FORBIDDEN_TOOL", "tool is prohibited");
    }
    const tool = this.tools.get(input.toolId);
    if (input.toolId && !tool && input.action !== "execute" && input.action !== "observe") {
      return deny("UNKNOWN_TOOL", "unknown tool");
    }
    if (tool && !tool.implemented) return deny("UNKNOWN_TOOL", "tool not implemented");
    if (input.budgetRemaining <= 0) return deny("BUDGET_EXHAUSTED", "budget exhausted", "BLOCKED");
    if (input.domainLevel <= 0 && input.action !== "observe") {
      return deny("AUTONOMY_DISABLED", "level 0 observe only", "BLOCKED");
    }
    const high = input.risk === "HIGH" || input.action === "publish" || input.action === "distribute" || input.toolId === "publish_content" || input.toolId === "schedule_content";
    if (high) {
      if (!input.content || input.content.truth !== "passed") return deny("TRUTH_REQUIRED", "truth validation missing");
      if (input.content.compliance !== "passed") return deny("COMPLIANCE_REQUIRED", "compliance missing");
      if (input.content.brand !== "passed") return deny("BRAND_REQUIRED", "brand/provenance missing");
      if (!input.productionAutonomy) return deny("PRODUCTION_AUTONOMY_DISABLED", "production autonomy is disabled", "BLOCKED");
      if (!input.approvalId) return deny("APPROVAL_REQUIRED", "high-risk requires human approval", "REQUIRE_HUMAN_APPROVAL");
    }
    if (tool?.approvalRequired && !input.approvalId) {
      return deny("APPROVAL_REQUIRED", "tool requires human approval", "REQUIRE_HUMAN_APPROVAL");
    }
    return { verdict: "ALLOW", code: "ALLOW", reason: "policy allow", at };
  }

  async execute(req: {
    agentId: string;
    actor: Actor;
    workflowId?: string;
    correlationId?: string;
    idempotencyKey?: string;
    timeoutMs?: number;
    depth?: number;
    tools?: Array<{ toolId: string; input: Record<string, unknown>; approvalId?: string }>;
    gates?: ContentGates;
  }): Promise<ExecutionRecord> {
    const correlationId = req.correlationId || randomUUID();
    const timeoutMs = req.timeoutMs ?? this.defaultTimeoutMs;
    const depth = req.depth ?? 0;
    if (depth > this.maxDepth) {
      throw new ControlError("RUNAWAY", "uncontrolled recursion", 429);
    }
    if (req.idempotencyKey) {
      const existingId = this.byIdempotency.get(`${req.actor.tenantId}:${req.idempotencyKey}`);
      if (existingId) {
        const existing = this.executions.get(existingId);
        if (existing) return existing;
      }
    }
    const start = this.now();
    const ex: ExecutionRecord = {
      id: randomUUID(),
      workflowId: req.workflowId || randomUUID(),
      agentId: req.agentId,
      tenantId: req.actor.tenantId,
      actorId: req.actor.subjectId,
      correlationId,
      status: "PENDING",
      startTime: new Date(start).toISOString(),
      timeoutMs,
      toolCalls: [],
      policyDecisions: [],
      depth,
      idempotencyKey: req.idempotencyKey,
    };
    try {
      this.resolve(req.agentId, req.actor);
    } catch (err) {
      const code = err instanceof ControlError ? err.code : "DENIED";
      ex.status = "BLOCKED";
      ex.error = code;
      ex.endTime = new Date(this.now()).toISOString();
      this.executions.set(ex.id, ex);
      this.audit({
        tenantId: req.actor.tenantId,
        actorId: req.actor.subjectId,
        agentId: req.agentId,
        executionId: ex.id,
        action: "EXECUTE",
        result: "DENIED",
        error: code,
        correlationId,
      });
      return ex;
    }
    if (this.getKill(req.actor.tenantId) === "ENGAGED") {
      ex.status = "BLOCKED";
      ex.error = "KILL_SWITCH_ENGAGED";
      ex.endTime = new Date(this.now()).toISOString();
      this.executions.set(ex.id, ex);
      return ex;
    }
    const running = this.running.get(req.actor.tenantId) ?? 0;
    if (running >= this.maxConcurrent) {
      ex.status = "BLOCKED";
      ex.error = "CONCURRENCY_LIMIT";
      ex.endTime = new Date(this.now()).toISOString();
      this.executions.set(ex.id, ex);
      return ex;
    }
    this.running.set(req.actor.tenantId, running + 1);
    this.transition(ex, "RUNNING");
    this.executions.set(ex.id, ex);
    if (req.idempotencyKey) this.byIdempotency.set(`${req.actor.tenantId}:${req.idempotencyKey}`, ex.id);

    const spec = this.agents.get(req.agentId)!;
    const tools = req.tools ?? [];
    if (tools.length > this.maxSteps) {
      this.fail(ex, "UNBOUNDED_EXECUTION");
      return ex;
    }
    try {
      if (spec.tools.length === 0 && tools.length === 0) {
        ex.result = { observed: true, side_effects: false, production_autonomy: this.productionAutonomy };
        this.succeed(ex);
        return ex;
      }
      const gates = req.gates ?? { truth: "unknown", compliance: "unknown", brand: "unknown" };
      for (const step of tools) {
        if (this.cancels.has(ex.id)) {
          this.transition(ex, "CANCELLED");
          ex.endTime = new Date(this.now()).toISOString();
          return ex;
        }
        if (this.now() - start > timeoutMs) {
          this.transition(ex, "TIMED_OUT");
          ex.error = "TIMEOUT";
          ex.endTime = new Date(this.now()).toISOString();
          return ex;
        }
        const call = await this.invokeTool(ex, spec, req.actor, step.toolId, step.input, gates, step.approvalId);
        ex.toolCalls.push(call);
        if (this.now() - start > timeoutMs) {
          this.transition(ex, "TIMED_OUT");
          ex.error = "TIMEOUT";
          ex.endTime = new Date(this.now()).toISOString();
          return ex;
        }
        if (call.policy.verdict === "REQUIRE_HUMAN_APPROVAL") {
          this.transition(ex, "WAITING_APPROVAL");
          return ex;
        }
        if (call.policy.verdict !== "ALLOW" || call.error) {
          this.fail(ex, call.error || call.policy.code);
          return ex;
        }
      }
      ex.result = {
        tool_calls: ex.toolCalls.length,
        provider_called: false,
        production_autonomy: this.productionAutonomy,
      };
      this.succeed(ex);
      return ex;
    } finally {
      const n = this.running.get(req.actor.tenantId) ?? 1;
      this.running.set(req.actor.tenantId, Math.max(0, n - 1));
    }
  }

  cancel(executionId: string, actor: Actor): ExecutionRecord {
    const ex = this.executions.get(executionId);
    if (!ex) throw new ControlError("INVALID_EXECUTION", "unknown execution", 404);
    if (ex.tenantId !== actor.tenantId) throw new ControlError("TENANT_MISMATCH", "wrong tenant");
    if (!canExecute(actor) && !canControl(actor)) throw new ControlError("DENIED", "unauthorized cancel");
    this.cancels.add(executionId);
    if (!TERMINAL.includes(ex.status) && ex.status !== "WAITING_APPROVAL") {
      this.transition(ex, "CANCELLED");
      ex.endTime = new Date(this.now()).toISOString();
    } else if (ex.status === "WAITING_APPROVAL") {
      this.transition(ex, "CANCELLED");
      ex.endTime = new Date(this.now()).toISOString();
    }
    return ex;
  }

  getExecution(id: string, actor: Actor): ExecutionRecord {
    const ex = this.executions.get(id);
    if (!ex) throw new ControlError("INVALID_EXECUTION", "unknown execution", 404);
    if (ex.tenantId !== actor.tenantId) throw new ControlError("TENANT_MISMATCH", "wrong tenant");
    return ex;
  }

  requestApproval(ex: ExecutionRecord, action: string, target: string, risk: RiskLevel, agentId: string, actor: Actor): ApprovalRecord {
    const rec: ApprovalRecord = {
      id: randomUUID(),
      tenantId: actor.tenantId,
      executionId: ex.id,
      workflowId: ex.workflowId,
      requestedAction: action,
      target,
      riskLevel: risk,
      requestingAgent: agentId,
      requestingActor: actor.subjectId,
      approvingActor: "",
      timestamp: new Date(this.now()).toISOString(),
      decision: "PENDING",
      reason: "",
      actionFingerprint: fingerprint(action, target, JSON.stringify({ body: target })),
      expiresAt: new Date(this.now() + 24 * 3600_000).toISOString(),
    };
    this.approvals.set(rec.id, rec);
    return rec;
  }

  decideApproval(id: string, actor: Actor, decision: "APPROVED" | "REJECTED" | "CANCELLED", reason: string, expectedFingerprint?: string): ApprovalRecord {
    if (!canControl(actor)) throw new ControlError("DENIED", "unauthorized approver");
    const rec = this.approvals.get(id);
    if (!rec) throw new ControlError("DENIED", "unknown approval", 404);
    if (rec.tenantId !== actor.tenantId) throw new ControlError("TENANT_MISMATCH", "wrong tenant");
    if (rec.decision !== "PENDING") throw new ControlError("DENIED", "approval not pending");
    if (this.now() > Date.parse(rec.expiresAt)) {
      rec.decision = "EXPIRED";
      throw new ControlError("DENIED", "approval expired");
    }
    if (rec.riskLevel === "HIGH" && rec.requestingActor === actor.subjectId) {
      throw new ControlError("DENIED", "self-approval denied");
    }
    if (expectedFingerprint && expectedFingerprint !== rec.actionFingerprint) {
      throw new ControlError("REJECTED", "action mutated after request; re-approval required");
    }
    rec.decision = decision;
    rec.reason = reason;
    rec.approvingActor = actor.subjectId;
    rec.decidedAt = new Date(this.now()).toISOString();
    return rec;
  }

  writeMemory(actor: Actor, agentId: string, text: string): MemoryRecord {
    if (!canExecute(actor)) throw new ControlError("DENIED", "unauthorized memory write");
    const lower = text.toLowerCase();
    if (["grant role", "bypass approval", "bypass policy", "oauth token", "password"].some((n) => lower.includes(n))) {
      throw new ControlError("DENIED", "memory privilege denied");
    }
    const existing = this.memories.filter((m) => m.tenantId === actor.tenantId && !m.deleted);
    if (existing.length >= this.memoryLimit) throw new ControlError("DENIED", "memory limit", 429);
    const rec: MemoryRecord = {
      id: randomUUID(),
      tenantId: actor.tenantId,
      agentId,
      actorId: actor.subjectId,
      text,
      createdAt: new Date(this.now()).toISOString(),
      deleted: false,
    };
    this.memories.push(rec);
    return rec;
  }

  readMemory(actor: Actor, id: string): MemoryRecord {
    const rec = this.memories.find((m) => m.id === id);
    if (!rec || rec.deleted) throw new ControlError("DENIED", "memory unavailable", 404);
    if (rec.tenantId !== actor.tenantId) throw new ControlError("DENIED", "cross-tenant memory");
    return rec;
  }

  deleteMemory(actor: Actor, id: string): void {
    if (!canControl(actor)) throw new ControlError("DENIED", "unauthorized delete");
    const rec = this.memories.find((m) => m.id === id && m.tenantId === actor.tenantId);
    if (rec) rec.deleted = true;
  }

  remainingBudget(tenantId: string): number {
    return this.budgetLimit - (this.spend.get(tenantId) ?? 0);
  }

  charge(tenantId: string, tokens: number): void {
    this.spend.set(tenantId, (this.spend.get(tenantId) ?? 0) + tokens);
  }

  auditTrail(): AuditEvent[] {
    return this.auditLog.map((e) => ({ ...e }));
  }

  logsAreRedacted(): boolean {
    const blob = JSON.stringify(this.auditLog);
    return !/Bearer [A-Za-z0-9._\-]+/.test(blob) && !/"password":\s*"[^R]/.test(blob);
  }

  async runWorkflow(actor: Actor, input: { text: string; contentId: string; connectionId?: string; brandApplied: boolean }): Promise<ExecutionRecord> {
    const workflowId = randomUUID();
    const gates: ContentGates = { truth: "unknown", compliance: "unknown", brand: "unknown" };
    const orch = await this.execute({
      agentId: "AGT-025",
      actor,
      workflowId,
      tools: [
        { toolId: "analyze_story", input: { tenant_id: actor.tenantId, text: input.text } },
        { toolId: "generate_content", input: { tenant_id: actor.tenantId, text: input.text } },
        { toolId: "validate_facts", input: { tenant_id: actor.tenantId, text: input.text } },
        { toolId: "check_compliance", input: { tenant_id: actor.tenantId, text: input.text } },
        { toolId: "check_brand", input: { tenant_id: actor.tenantId, text: input.text, brand_identity_applied: input.brandApplied } },
        { toolId: "adapt_content", input: { tenant_id: actor.tenantId, text: input.text } },
      ],
      gates,
    });
    if (orch.status !== "SUCCEEDED") return orch;
    const last = orch.toolCalls;
    if (last.find((c) => c.toolId === "validate_facts")?.output?.passed) gates.truth = "passed";
    if (last.find((c) => c.toolId === "check_compliance")?.output?.passed) gates.compliance = "passed";
    if (last.find((c) => c.toolId === "check_brand")?.output?.passed) gates.brand = "passed";
    const pub = await this.execute({
      agentId: "AGT-014",
      actor,
      workflowId,
      gates,
      tools: [
        {
          toolId: "publish_content",
          input: {
            tenant_id: actor.tenantId,
            content_id: input.contentId,
            content_version: "v1",
            body: input.text,
            brand_identity_applied: input.brandApplied,
            connection_id: input.connectionId ?? "",
          },
        },
      ],
    });
    return pub;
  }

  private async invokeTool(
    ex: ExecutionRecord,
    agent: AgentSpec,
    actor: Actor,
    toolId: string,
    input: Record<string, unknown>,
    gates: ContentGates,
    approvalId?: string,
  ): Promise<ToolCallRecord> {
    const at = new Date(this.now()).toISOString();
    const id = randomUUID();
    if (FORBIDDEN_TOOLS.includes(toolId as (typeof FORBIDDEN_TOOLS)[number])) {
      const policy = this.decide(this.policyInput(actor, agent.id, toolId, "invoke", "HIGH", gates, approvalId));
      ex.policyDecisions.push(policy);
      this.audit({ tenantId: actor.tenantId, actorId: actor.subjectId, agentId: agent.id, executionId: ex.id, toolId, action: "TOOL", policy, result: "DENIED", correlationId: ex.correlationId });
      return { id, toolId, input: redact(input) as Record<string, unknown>, policy, error: policy.code, at };
    }
    if (!this.allowRate(actor.tenantId, toolId)) {
      const policy: PolicyDecision = { verdict: "THROTTLED", code: "RATE_LIMIT", reason: "rate exceeded", at };
      ex.policyDecisions.push(policy);
      return { id, toolId, input: redact(input) as Record<string, unknown>, policy, error: "RATE_LIMIT", at };
    }
    const tool = this.tools.get(toolId);
    if (!tool) {
      const policy: PolicyDecision = { verdict: "DENY", code: "UNKNOWN_TOOL", reason: "unknown tool", at };
      ex.policyDecisions.push(policy);
      return { id, toolId, input: redact(input) as Record<string, unknown>, policy, error: "UNKNOWN_TOOL", at };
    }
    if (!agent.tools.includes(toolId)) {
      const policy: PolicyDecision = { verdict: "DENY", code: "UNAUTHORIZED_TOOL", reason: "agent not granted tool", at };
      ex.policyDecisions.push(policy);
      return { id, toolId, input: redact(input) as Record<string, unknown>, policy, error: "UNAUTHORIZED_TOOL", at };
    }
    if (input.tenant_id && input.tenant_id !== actor.tenantId) {
      const policy: PolicyDecision = { verdict: "DENY", code: "WRONG_TENANT", reason: "tool tenant mismatch", at };
      ex.policyDecisions.push(policy);
      return { id, toolId, input: redact(input) as Record<string, unknown>, policy, error: "WRONG_TENANT", at };
    }
    if (tool.inputSchema.required) {
      for (const key of tool.inputSchema.required) {
        if (input[key] === undefined || input[key] === "") {
          const policy: PolicyDecision = { verdict: "DENY", code: "INVALID_INPUT", reason: `missing ${key}`, at };
          ex.policyDecisions.push(policy);
          return { id, toolId, input: redact(input) as Record<string, unknown>, policy, error: "INVALID_INPUT", at };
        }
      }
    }
    const action = toolId === "publish_content" ? "publish" : toolId;
    const policy = this.decide(this.policyInput(actor, agent.id, toolId, action, tool.riskLevel, gates, approvalId));
    ex.policyDecisions.push(policy);
    this.audit({
      tenantId: actor.tenantId,
      actorId: actor.subjectId,
      agentId: agent.id,
      executionId: ex.id,
      workflowId: ex.workflowId,
      toolId,
      action: "TOOL",
      policy,
      approvalId,
      result: policy.verdict,
      correlationId: ex.correlationId,
    });
    if (policy.verdict === "REQUIRE_HUMAN_APPROVAL") {
      const rec = this.requestApproval(ex, action, String(input.content_id ?? input.text ?? ""), tool.riskLevel, agent.id, actor);
      return { id, toolId, input: redact(input) as Record<string, unknown>, policy, output: { approval_id: rec.id }, at };
    }
    if (policy.verdict !== "ALLOW") {
      return { id, toolId, input: redact(input) as Record<string, unknown>, policy, error: policy.code, at };
    }
    if (approvalId) {
      const rec = this.approvals.get(approvalId);
      if (!rec || rec.tenantId !== actor.tenantId || rec.decision !== "APPROVED") {
        const p: PolicyDecision = { verdict: "DENY", code: "DENIED", reason: "approval not valid", at };
        return { id, toolId, input: redact(input) as Record<string, unknown>, policy: p, error: "DENIED", at };
      }
      const current = fingerprint(action, String(input.content_id ?? input.text ?? ""), JSON.stringify({ body: String(input.content_id ?? input.text ?? "") }));
      if (current !== rec.actionFingerprint) {
        const p: PolicyDecision = { verdict: "DENY", code: "REAPPROVAL_REQUIRED", reason: "mutated after approval", at };
        return { id, toolId, input: redact(input) as Record<string, unknown>, policy: p, error: "REAPPROVAL_REQUIRED", at };
      }
    }
    try {
      const output = await this.runToolBody(toolId, actor, input, gates);
      if (toolId === "generate_content") this.charge(actor.tenantId, Number(output.tokens ?? 1));
      return { id, toolId, input: redact(input) as Record<string, unknown>, output: redact(output) as Record<string, unknown>, policy, at };
    } catch (err) {
      const code = err instanceof ControlError ? err.code : "FAILED";
      return { id, toolId, input: redact(input) as Record<string, unknown>, policy, error: code, at };
    }
  }

  private async runToolBody(toolId: string, actor: Actor, input: Record<string, unknown>, gates: ContentGates): Promise<Record<string, unknown>> {
    const text = String(input.text ?? "");
    switch (toolId) {
      case "analyze_story":
        return { summary: text.slice(0, 120), provider_called: false };
      case "generate_content": {
        if (this.remainingBudget(actor.tenantId) <= 0) throw new ControlError("BUDGET_EXHAUSTED", "budget exhausted");
        if (this.ports.llm) {
          const out = await this.ports.llm.complete(text);
          return { text: out.text, tokens: out.tokens, cost_source: "ESTIMATED", provider_called: false };
        }
        return { text: `DRAFT: ${text}`.slice(0, 200), tokens: 8, cost_source: "ESTIMATED", provider_called: false };
      }
      case "validate_facts": {
        if (!this.ports.truth) throw new ControlError("TRUTH_REQUIRED", "truth port unwired");
        const passed = await this.ports.truth.validate(text);
        gates.truth = passed ? "passed" : "failed";
        if (!passed) throw new ControlError("TRUTH_REQUIRED", "truth failed");
        return { passed: true };
      }
      case "check_compliance": {
        if (!this.ports.compliance) throw new ControlError("COMPLIANCE_REQUIRED", "compliance port unwired");
        const passed = await this.ports.compliance.check(text);
        gates.compliance = passed ? "passed" : "failed";
        if (!passed) throw new ControlError("COMPLIANCE_REQUIRED", "compliance failed");
        return { passed: true };
      }
      case "adapt_content":
        return { text, adapted: true, provider_called: false };
      case "check_brand": {
        const applied = Boolean(input.brand_identity_applied);
        gates.brand = applied ? "passed" : "failed";
        if (!applied) throw new ControlError("BRAND_REQUIRED", "brand identity required");
        return { passed: true, mark: "— Agbofa Nexus AI" };
      }
      case "read_analytics": {
        if (!this.ports.analytics) throw new ControlError("DENIED", "analytics port unwired");
        const data = await this.ports.analytics.read(actor.tenantId);
        return { ...data, provider_called: false };
      }
      case "schedule_content":
      case "publish_content": {
        if (!this.ports.phase04) throw new ControlError("DENIED", "phase04 port unwired");
        if (!input.brand_identity_applied) throw new ControlError("BRAND_REQUIRED", "brand required");
        const result = await this.ports.phase04.schedule({
          tenantId: actor.tenantId,
          actorId: actor.subjectId,
          contentId: String(input.content_id ?? ""),
          contentVersion: String(input.content_version ?? "v1"),
          body: String(input.body ?? input.text ?? ""),
          brandApplied: true,
          connectionId: String(input.connection_id ?? ""),
          mediaUrl: input.media_url ? String(input.media_url) : undefined,
          approved: true,
        });
        return { ...result, via: "phase04", provider_called: false, phase03: "deferred_to_phase04_worker" };
      }
      default:
        throw new ControlError("UNKNOWN_TOOL", "not implemented");
    }
  }

  private policyInput(actor: Actor, agentId: string, toolId: string, action: string, risk: RiskLevel, gates: ContentGates, approvalId?: string): PolicyInput {
    return {
      tenantId: actor.tenantId,
      actor,
      agentId,
      toolId,
      action,
      risk,
      content: gates,
      approvalId,
      budgetRemaining: this.remainingBudget(actor.tenantId),
      killSwitch: this.getKill(actor.tenantId),
      domainLevel: this.domainLevel.get(actor.tenantId) ?? 3,
      productionAutonomy: this.productionAutonomy,
    };
  }

  private allowRate(tenantId: string, key: string): boolean {
    const k = `${tenantId}:${key}`;
    const now = this.now();
    const windowStart = now - 60_000;
    const hits = (this.rateBuckets.get(k) ?? []).filter((t) => t > windowStart);
    if (hits.length >= this.ratePerMinute) {
      this.rateBuckets.set(k, hits);
      return false;
    }
    hits.push(now);
    this.rateBuckets.set(k, hits);
    return true;
  }

  private transition(ex: ExecutionRecord, next: ExecutionStatus): void {
    const allowed: Record<string, ExecutionStatus[]> = {
      PENDING: ["RUNNING", "BLOCKED", "CANCELLED"],
      RUNNING: ["WAITING", "WAITING_APPROVAL", "SUCCEEDED", "FAILED", "CANCELLED", "TIMED_OUT", "BLOCKED"],
      WAITING: ["RUNNING", "CANCELLED", "BLOCKED", "TIMED_OUT"],
      WAITING_APPROVAL: ["RUNNING", "CANCELLED", "BLOCKED", "FAILED"],
      SUCCEEDED: [],
      FAILED: [],
      CANCELLED: [],
      TIMED_OUT: [],
      BLOCKED: [],
    };
    if (!allowed[ex.status]?.includes(next)) {
      throw new ControlError("INVALID_TRANSITION", `${ex.status} -> ${next}`);
    }
    ex.status = next;
  }

  private succeed(ex: ExecutionRecord): void {
    this.transition(ex, "SUCCEEDED");
    ex.endTime = new Date(this.now()).toISOString();
  }

  private fail(ex: ExecutionRecord, code: string): void {
    if (ex.status === "RUNNING" || ex.status === "WAITING" || ex.status === "WAITING_APPROVAL" || ex.status === "PENDING") {
      try {
        this.transition(ex, code === "KILL_SWITCH_ENGAGED" || code === "PRODUCTION_AUTONOMY_DISABLED" || code === "AUTONOMY_DISABLED" || code === "CONCURRENCY_LIMIT" ? "BLOCKED" : "FAILED");
      } catch {
        ex.status = "FAILED";
      }
    }
    ex.error = code;
    ex.endTime = new Date(this.now()).toISOString();
  }

  private audit(e: Omit<AuditEvent, "at">): void {
    this.auditLog.push({ at: new Date(this.now()).toISOString(), ...e });
  }
}

export function admin(tenant = "tenant-a"): Actor {
  return { subjectId: "admin-1", tenantId: tenant, roles: ["TENANT_ADMIN"] };
}

export function editor(tenant = "tenant-a"): Actor {
  return { subjectId: "editor-1", tenantId: tenant, roles: ["EDITOR"] };
}

export function reader(tenant = "tenant-a"): Actor {
  return { subjectId: "reader-1", tenantId: tenant, roles: ["READER"] };
}
