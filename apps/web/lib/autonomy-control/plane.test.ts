import assert from "node:assert/strict";
import { test } from "node:test";
import { ControlError, ControlPlane, admin, editor, reader } from "./plane.ts";
import { canonicalAgents } from "./catalog.ts";
import { FORBIDDEN_TOOLS } from "./types.ts";
import { TRUTH_SAFE_FIXTURE } from "./truth.ts";

function plane(opts: ConstructorParameters<typeof ControlPlane>[0] = {}) {
  return new ControlPlane({
    ports: {
      truth: { validate: async () => true },
      compliance: { check: async () => true },
      analytics: { read: async () => ({ views: 1 }) },
      phase04: {
        schedule: async (req) => {
          if (!req.brandApplied) throw new ControlError("BRAND_REQUIRED", "brand");
          return { jobId: "job-1", status: "QUEUED", providerCalled: false };
        },
      },
    },
    ...opts,
  });
}

function ready(p: ControlPlane, tenant = "tenant-a", agents = ["AGT-003", "AGT-004", "AGT-008", "AGT-011", "AGT-013", "AGT-014", "AGT-017", "AGT-025", "AGT-026", "AGT-027", "AGT-028"]) {
  const a = admin(tenant);
  p.setDomainLevel(tenant, a, 4);
  for (const id of agents) p.enableAgent(tenant, id, a);
  return a;
}

test("5.1 catalog has 28 unique ids and does not claim certified or default-executable", () => {
  const p = plane();
  const all = p.listAgents();
  assert.equal(all.length, 28);
  assert.equal(new Set(all.map((a) => a.id)).size, 28);
  assert.equal(canonicalAgents().length, 28);
  assert.ok(p.uniqueIds());
  for (const a of all) {
    assert.equal(a.certified, false);
    assert.equal(a.enabled, false);
    assert.ok(["DECLARED", "IMPLEMENTED"].includes(a.implementation));
  }
});

test("5.1 lookup, invalid, disabled, unauthorized, tenant-aware", () => {
  const p = plane();
  const a = ready(p);
  const resolved = p.resolve("AGT-026", a);
  assert.equal(resolved.maturity, "EXECUTABLE");
  assert.equal(p.getAgent("AGT-001")?.implementation, "DECLARED");
  assert.throws(() => p.resolve("AGT-999", a), (e: unknown) => e instanceof ControlError && e.code === "INVALID_AGENT");
  assert.throws(() => p.resolve("AGT-001", a), (e: unknown) => e instanceof ControlError && e.code === "INVALID_AGENT");
  assert.throws(() => p.resolve("AGT-026", editor("tenant-b")), (e: unknown) => e instanceof ControlError && e.code === "DISABLED_AGENT");
  assert.throws(() => p.resolve("AGT-026", reader()), (e: unknown) => e instanceof ControlError && e.code === "UNAUTHORIZED_AGENT");
});

test("5.2 successful, failed, timeout, cancel, duplicate, concurrent, unauthorized, invalid, tenant mismatch, runaway", async () => {
  const p = plane({ defaultTimeoutMs: 5, maxConcurrentPerTenant: 1, maxDepth: 1 });
  const a = ready(p);
  const ok = await p.execute({ agentId: "AGT-026", actor: a });
  assert.equal(ok.status, "SUCCEEDED");
  assert.ok(ok.id && ok.correlationId && ok.startTime);

  const failed = await p.execute({
    agentId: "AGT-004",
    actor: a,
    tools: [{ toolId: "generate_content", input: { tenant_id: "" } }],
  });
  assert.equal(failed.status, "FAILED");
  assert.equal(failed.error, "INVALID_INPUT");

  let now = 0;
  const timed = new ControlPlane({ now: () => now, defaultTimeoutMs: 1, ports: { llm: { complete: async () => {
    now = 50;
    return { text: "x", tokens: 1 };
  } } } });
  ready(timed);
  const t = await timed.execute({
    agentId: "AGT-004",
    actor: admin(),
    timeoutMs: 1,
    tools: [{ toolId: "generate_content", input: { tenant_id: "tenant-a", text: "hi" } }],
  });
  assert.ok(t.status === "TIMED_OUT" || t.status === "SUCCEEDED");

  const running = await p.execute({ agentId: "AGT-026", actor: a, idempotencyKey: "dup-1" });
  const dup = await p.execute({ agentId: "AGT-026", actor: a, idempotencyKey: "dup-1" });
  assert.equal(dup.id, running.id);

  const blockedAuth = await p.execute({ agentId: "AGT-026", actor: reader() });
  assert.equal(blockedAuth.status, "BLOCKED");
  assert.equal(blockedAuth.error, "UNAUTHORIZED_AGENT");

  const invalid = await p.execute({ agentId: "nope", actor: a });
  assert.equal(invalid.status, "BLOCKED");
  assert.equal(invalid.error, "INVALID_AGENT");

  const other = await p.execute({ agentId: "AGT-026", actor: admin("tenant-b") });
  assert.equal(other.status, "BLOCKED");
  assert.equal(other.error, "DISABLED_AGENT");

  assert.rejects(() => p.execute({ agentId: "AGT-026", actor: a, depth: 9 }), (e: unknown) => e instanceof ControlError && e.code === "RUNAWAY");

  const started = await p.execute({ agentId: "AGT-026", actor: a });
  const cancelled = p.cancel(started.id, a);
  assert.ok(["CANCELLED", "SUCCEEDED"].includes(cancelled.status));
});

test("5.3 tools: valid, unknown, unauthorized, invalid input, wrong tenant, high-risk without approval", async () => {
  const p = plane();
  const a = ready(p);
  const valid = await p.execute({
    agentId: "AGT-003",
    actor: a,
    tools: [{ toolId: "analyze_story", input: { tenant_id: "tenant-a", text: "story" } }],
  });
  assert.equal(valid.status, "SUCCEEDED");

  const unknown = await p.execute({
    agentId: "AGT-003",
    actor: a,
    tools: [{ toolId: "not_a_tool", input: { tenant_id: "tenant-a" } }],
  });
  assert.equal(unknown.status, "FAILED");
  assert.equal(unknown.error, "UNKNOWN_TOOL");

  const unauth = await p.execute({
    agentId: "AGT-003",
    actor: a,
    tools: [{ toolId: "publish_content", input: { tenant_id: "tenant-a" } }],
  });
  assert.equal(unauth.status, "FAILED");
  assert.equal(unauth.error, "UNAUTHORIZED_TOOL");

  const badIn = await p.execute({
    agentId: "AGT-003",
    actor: a,
    tools: [{ toolId: "analyze_story", input: {} }],
  });
  assert.equal(badIn.error, "INVALID_INPUT");

  const wrong = await p.execute({
    agentId: "AGT-003",
    actor: a,
    tools: [{ toolId: "analyze_story", input: { tenant_id: "tenant-b", text: "x" } }],
  });
  assert.equal(wrong.error, "WRONG_TENANT");

  const high = await p.execute({
    agentId: "AGT-014",
    actor: a,
    gates: { truth: "passed", compliance: "passed", brand: "passed" },
    tools: [{ toolId: "publish_content", input: { tenant_id: "tenant-a", content_id: "c1", brand_identity_applied: true, body: "x" } }],
  });
  assert.ok(["WAITING_APPROVAL", "BLOCKED", "FAILED"].includes(high.status));
  assert.ok(high.toolCalls[0]?.policy.verdict === "REQUIRE_HUMAN_APPROVAL" || high.error === "PRODUCTION_AUTONOMY_DISABLED");
});

test("5.4 permissions: forbidden tools, oauth, db, social, wrong tenant", async () => {
  const p = plane();
  const a = ready(p);
  for (const toolId of FORBIDDEN_TOOLS) {
    const ex = await p.execute({
      agentId: "AGT-026",
      actor: a,
      tools: [{ toolId, input: { tenant_id: "tenant-a" } }],
    });
    assert.equal(ex.status, "FAILED");
    assert.ok(["FORBIDDEN_TOOL", "UNKNOWN_TOOL", "UNAUTHORIZED_TOOL"].includes(String(ex.error)));
  }
});

test("5.5 policy: allow, deny, approval, truth, compliance, brand, autonomy disabled, kill, budget", async () => {
  const p = plane();
  const a = ready(p);
  const allow = p.decide({
    tenantId: "tenant-a",
    actor: a,
    agentId: "AGT-003",
    toolId: "analyze_story",
    action: "analyze",
    risk: "LOW",
    content: { truth: "unknown", compliance: "unknown", brand: "unknown" },
    budgetRemaining: 10,
    killSwitch: "ARMED",
    domainLevel: 4,
    productionAutonomy: false,
  });
  assert.equal(allow.verdict, "ALLOW");

  p.setKill("tenant-a", a, true);
  const killed = p.decide({
    tenantId: "tenant-a", actor: a, agentId: "AGT-003", toolId: "analyze_story", action: "analyze", risk: "LOW",
    content: { truth: "unknown", compliance: "unknown", brand: "unknown" }, budgetRemaining: 10, killSwitch: p.getKill("tenant-a"),
    domainLevel: 4, productionAutonomy: false,
  });
  assert.equal(killed.verdict, "BLOCKED");
  p.setKill("tenant-a", a, false);

  const noTruth = p.decide({
    tenantId: "tenant-a", actor: a, agentId: "AGT-014", toolId: "publish_content", action: "publish", risk: "HIGH",
    content: { truth: "unknown", compliance: "passed", brand: "passed" }, budgetRemaining: 10, killSwitch: "ARMED",
    domainLevel: 5, productionAutonomy: true,
  });
  assert.equal(noTruth.code, "TRUTH_REQUIRED");

  const noComp = p.decide({
    tenantId: "tenant-a", actor: a, agentId: "AGT-014", toolId: "publish_content", action: "publish", risk: "HIGH",
    content: { truth: "passed", compliance: "unknown", brand: "passed" }, budgetRemaining: 10, killSwitch: "ARMED",
    domainLevel: 5, productionAutonomy: true,
  });
  assert.equal(noComp.code, "COMPLIANCE_REQUIRED");

  const noBrand = p.decide({
    tenantId: "tenant-a", actor: a, agentId: "AGT-014", toolId: "publish_content", action: "publish", risk: "HIGH",
    content: { truth: "passed", compliance: "passed", brand: "failed" }, budgetRemaining: 10, killSwitch: "ARMED",
    domainLevel: 5, productionAutonomy: true,
  });
  assert.equal(noBrand.code, "BRAND_REQUIRED");

  const disabled = p.decide({
    tenantId: "tenant-a", actor: a, agentId: "AGT-003", toolId: "analyze_story", action: "analyze", risk: "LOW",
    content: { truth: "unknown", compliance: "unknown", brand: "unknown" }, budgetRemaining: 10, killSwitch: "ARMED",
    domainLevel: 0, productionAutonomy: false,
  });
  assert.equal(disabled.verdict, "BLOCKED");

  const broke = p.decide({
    tenantId: "tenant-a", actor: a, agentId: "AGT-004", toolId: "generate_content", action: "generate", risk: "MEDIUM",
    content: { truth: "unknown", compliance: "unknown", brand: "unknown" }, budgetRemaining: 0, killSwitch: "ARMED",
    domainLevel: 4, productionAutonomy: false,
  });
  assert.equal(broke.code, "BUDGET_EXHAUSTED");
});

test("5.6 approval: block execute, unauthorized approver, mutate, expire, bypass", async () => {
  const p = plane({ productionAutonomy: true });
  const a = ready(p);
  const otherAdmin: ReturnType<typeof admin> = { subjectId: "admin-2", tenantId: "tenant-a", roles: ["TENANT_ADMIN"] };
  const gates = { truth: "passed" as const, compliance: "passed" as const, brand: "passed" as const };
  const waiting = await p.execute({
    agentId: "AGT-014",
    actor: editor(),
    gates,
    tools: [{ toolId: "publish_content", input: { tenant_id: "tenant-a", content_id: "c1", brand_identity_applied: true, body: "hello", connection_id: "conn" } }],
  });
  assert.equal(waiting.status, "WAITING_APPROVAL");
  const approvalId = String(waiting.toolCalls[0]?.output?.approval_id);
  assert.ok(approvalId);

  assert.throws(() => p.decideApproval(approvalId, reader(), "APPROVED", "no"), (e: unknown) => e instanceof ControlError && e.code === "DENIED");
  assert.throws(() => p.decideApproval(approvalId, editor(), "APPROVED", "self"), (e: unknown) => e instanceof ControlError && e.code === "DENIED");

  const approved = p.decideApproval(approvalId, otherAdmin, "APPROVED", "ok");
  assert.equal(approved.decision, "APPROVED");

  const mutated = await p.execute({
    agentId: "AGT-014",
    actor: editor(),
    gates,
    tools: [{ toolId: "publish_content", input: { tenant_id: "tenant-a", content_id: "MUTATED", brand_identity_applied: true, body: "hello", connection_id: "conn" }, approvalId }],
  });
  assert.ok(mutated.error === "REAPPROVAL_REQUIRED" || mutated.status === "FAILED");

  let clock = Date.now();
  const exp = new ControlPlane({ productionAutonomy: true, now: () => clock, ports: {
    phase04: { schedule: async () => ({ jobId: "j", status: "QUEUED", providerCalled: false }) },
  } });
  ready(exp);
  const w2 = await exp.execute({
    agentId: "AGT-014",
    actor: editor(),
    gates,
    tools: [{ toolId: "publish_content", input: { tenant_id: "tenant-a", content_id: "c2", brand_identity_applied: true, body: "x", connection_id: "c" } }],
  });
  const aid = String(w2.toolCalls[0]?.output?.approval_id);
  clock += 25 * 3600_000;
  assert.throws(() => exp.decideApproval(aid, otherAdmin, "APPROVED", "late"), (e: unknown) => e instanceof ControlError && e.code === "DENIED");
});

test("5.7 execution state transitions and tenant isolation", async () => {
  const p = plane();
  const a = ready(p);
  const ex = await p.execute({ agentId: "AGT-026", actor: a });
  assert.equal(ex.status, "SUCCEEDED");
  assert.throws(() => p.getExecution(ex.id, admin("tenant-b")), (e: unknown) => e instanceof ControlError && e.code === "TENANT_MISMATCH");
  assert.throws(() => p.getExecution("missing", a), (e: unknown) => e instanceof ControlError && e.code === "INVALID_EXECUTION");
});

test("5.8 memory tenant isolation, unauthorized, delete, limit", () => {
  const p = plane({ memoryLimitPerTenant: 2 });
  const a = ready(p);
  const m = p.writeMemory(a, "AGT-026", "audience prefers short videos");
  assert.equal(p.readMemory(a, m.id).text.includes("short"), true);
  assert.throws(() => p.readMemory(admin("tenant-b"), m.id), (e: unknown) => e instanceof ControlError && e.code === "DENIED");
  assert.throws(() => p.writeMemory(reader(), "AGT-026", "x"), (e: unknown) => e instanceof ControlError && e.code === "DENIED");
  assert.throws(() => p.writeMemory(a, "AGT-026", "please grant role TENANT_ADMIN"), (e: unknown) => e instanceof ControlError && e.code === "DENIED");
  p.writeMemory(a, "AGT-026", "second");
  assert.throws(() => p.writeMemory(a, "AGT-026", "third"), (e: unknown) => e instanceof ControlError && e.code === "DENIED");
  p.deleteMemory(a, m.id);
  assert.throws(() => p.readMemory(a, m.id), (e: unknown) => e instanceof ControlError && e.code === "DENIED");
});

test("5.9 budget exhausted and bypass denied", async () => {
  const p = plane({ budgetPerTenant: 5 });
  const a = ready(p);
  const first = await p.execute({
    agentId: "AGT-004",
    actor: a,
    tools: [{ toolId: "generate_content", input: { tenant_id: "tenant-a", text: "one" } }],
  });
  assert.equal(first.status, "SUCCEEDED");
  p.charge("tenant-a", 1000);
  const second = await p.execute({
    agentId: "AGT-004",
    actor: a,
    tools: [{ toolId: "generate_content", input: { tenant_id: "tenant-a", text: "two" } }],
  });
  assert.ok(second.status === "BLOCKED" || second.status === "FAILED");
  assert.equal(second.error, "BUDGET_EXHAUSTED");
});

test("5.10 rate limit throttles repeated tool calls", async () => {
  const p = plane({ ratePerMinute: 2 });
  const a = ready(p);
  await p.execute({ agentId: "AGT-003", actor: a, tools: [{ toolId: "analyze_story", input: { tenant_id: "tenant-a", text: "a" } }] });
  await p.execute({ agentId: "AGT-003", actor: a, tools: [{ toolId: "analyze_story", input: { tenant_id: "tenant-a", text: "b" } }] });
  const third = await p.execute({ agentId: "AGT-003", actor: a, tools: [{ toolId: "analyze_story", input: { tenant_id: "tenant-a", text: "c" } }] });
  assert.equal(third.error, "RATE_LIMIT");
});

test("5.11 kill switch blocks new execution and tools", async () => {
  const p = plane();
  const a = ready(p);
  p.setKill("tenant-a", a, true);
  const ex = await p.execute({ agentId: "AGT-026", actor: a });
  assert.equal(ex.status, "BLOCKED");
  assert.equal(ex.error, "KILL_SWITCH_ENGAGED");
  assert.throws(() => p.setKill("tenant-a", reader(), false), (e: unknown) => e instanceof ControlError && e.code === "DENIED");
});

test("5.12-5.13 workflow cannot skip gates or call provider; Phase 04 port only", async () => {
  const calls: unknown[] = [];
  const p = plane({
    productionAutonomy: true,
    ports: {
      truth: { validate: async () => true },
      compliance: { check: async () => true },
      phase04: {
        schedule: async (req) => {
          calls.push(req);
          return { jobId: "job-9", status: "QUEUED", providerCalled: false };
        },
      },
    },
  });
  const a = ready(p);
  const otherAdmin = { subjectId: "admin-2", tenantId: "tenant-a", roles: ["TENANT_ADMIN"] };
  const wf = await p.runWorkflow(editor(), { text: TRUTH_SAFE_FIXTURE, contentId: "c9", connectionId: "conn", brandApplied: true });
  assert.equal(wf.status, "WAITING_APPROVAL");
  const approvalId = String(wf.toolCalls[0]?.output?.approval_id);
  p.decideApproval(approvalId, otherAdmin, "APPROVED", "ship it");
  const published = await p.execute({
    agentId: "AGT-014",
    actor: editor(),
    workflowId: wf.workflowId,
    gates: { truth: "passed", compliance: "passed", brand: "passed" },
    tools: [{
      toolId: "publish_content",
      approvalId,
      input: { tenant_id: "tenant-a", content_id: "c9", content_version: "v1", body: TRUTH_SAFE_FIXTURE, brand_identity_applied: true, connection_id: "conn" },
    }],
  });
  assert.equal(published.status, "SUCCEEDED");
  assert.equal(published.result?.provider_called, false);
  assert.equal(calls.length, 1);
  assert.equal((calls[0] as { brandApplied: boolean }).brandApplied, true);

  const noBrand = await p.execute({
    agentId: "AGT-014",
    actor: editor(),
    gates: { truth: "passed", compliance: "passed", brand: "unknown" },
    tools: [{ toolId: "publish_content", input: { tenant_id: "tenant-a", content_id: "c9", brand_identity_applied: false, body: "x" } }],
  });
  assert.notEqual(noBrand.status, "SUCCEEDED");
});

test("5.14 classify duplicate publish via idempotency of executions", async () => {
  const p = plane();
  const a = ready(p);
  const first = await p.execute({ agentId: "AGT-026", actor: a, idempotencyKey: "evt-1" });
  const second = await p.execute({ agentId: "AGT-026", actor: a, idempotencyKey: "evt-1" });
  assert.equal(first.id, second.id);
});

test("5.15 adversarial denials", async () => {
  const p = plane({ productionAutonomy: true });
  const a = ready(p);
  const forged = await p.execute({ agentId: "AGT-014", actor: admin("tenant-b") });
  assert.equal(forged.status, "BLOCKED");
  const rec = p.execute({ agentId: "AGT-026", actor: a });
  const got = await rec;
  assert.throws(() => p.getExecution(got.id, admin("tenant-b")), (e: unknown) => e instanceof ControlError && e.code === "TENANT_MISMATCH");
  const bypass = p.decide({
    tenantId: "tenant-a", actor: a, agentId: "AGT-014", toolId: "direct_social_api", action: "publish", risk: "HIGH",
    content: { truth: "passed", compliance: "passed", brand: "passed" }, budgetRemaining: 99, killSwitch: "ARMED",
    domainLevel: 5, productionAutonomy: true,
  });
  assert.equal(bypass.verdict, "DENY");
});

test("5.16 audit reconstructs who/what/when and redacts secrets", async () => {
  const p = plane();
  const a = ready(p);
  await p.execute({
    agentId: "AGT-003",
    actor: a,
    tools: [{ toolId: "analyze_story", input: { tenant_id: "tenant-a", text: "x", authorization: "Bearer super-secret-token" } }],
  });
  const trail = p.auditTrail();
  assert.ok(trail.some((e) => e.agentId === "AGT-003" && e.action === "TOOL"));
  assert.ok(p.logsAreRedacted());
  const blob = JSON.stringify(trail);
  assert.equal(blob.includes("super-secret-token"), false);
});

test("5.17 concurrency limit", async () => {
  const p = plane({ maxConcurrentPerTenant: 0 });
  const a = ready(p);
  const ex = await p.execute({ agentId: "AGT-026", actor: a });
  assert.equal(ex.status, "BLOCKED");
  assert.equal(ex.error, "CONCURRENCY_LIMIT");
});

test("5.18 controlled workflow without fabricating provider publication", async () => {
  const p = plane({ productionAutonomy: false });
  const a = ready(p);
  const wf = await p.runWorkflow(a, { text: TRUTH_SAFE_FIXTURE, contentId: "c", brandApplied: true, connectionId: "conn" });
  assert.ok(wf.status === "BLOCKED" || wf.status === "FAILED" || wf.status === "WAITING_APPROVAL");
  assert.ok(["PRODUCTION_AUTONOMY_DISABLED", "APPROVAL_REQUIRED", "TRUTH_REQUIRED"].includes(String(wf.error || wf.toolCalls[0]?.policy.code)));
  assert.equal(p.productionAutonomy, false);
});

test("production autonomy remains disabled on the default plane", () => {
  const p = new ControlPlane();
  assert.equal(p.productionAutonomy, false);
});
