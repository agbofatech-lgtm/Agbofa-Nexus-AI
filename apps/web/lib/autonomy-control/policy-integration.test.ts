import assert from "node:assert/strict";
import { test } from "node:test";
import { ControlPlane, admin } from "./plane.ts";
import { TRUTH_SAFE_FIXTURE } from "./truth.ts";

function ready(p: ControlPlane) {
  const a = admin();
  p.setDomainLevel("tenant-a", a, 4);
  p.enableAgent("tenant-a", "AGT-008", a);
  p.enableAgent("tenant-a", "AGT-011", a);
  p.enableAgent("tenant-a", "AGT-014", a);
  return a;
}

test("truth fail blocks fact validation", async () => {
  const p = new ControlPlane();
  const a = ready(p);
  const ex = await p.execute({
    agentId: "AGT-008",
    actor: a,
    tools: [{ toolId: "validate_facts", input: { tenant_id: "tenant-a", text: "the earth is flat" } }],
  });
  assert.ok(ex.status === "FAILED" || ex.status === "BLOCKED");
  assert.ok(["TRUTH_REQUIRED", "TRUTH_FAILED"].includes(String(ex.error)));
});

test("compliance fail blocks check", async () => {
  const p = new ControlPlane();
  const a = ready(p);
  const ex = await p.execute({
    agentId: "AGT-011",
    actor: a,
    tools: [{ toolId: "check_compliance", input: { tenant_id: "tenant-a", text: "email person@example.com" } }],
  });
  assert.ok(ex.status === "FAILED" || ex.status === "BLOCKED");
  assert.ok(["COMPLIANCE_REQUIRED", "COMPLIANCE_FAILED"].includes(String(ex.error)));
});

test("unknown truth is not verified", async () => {
  const p = new ControlPlane();
  const a = ready(p);
  const ex = await p.execute({
    agentId: "AGT-008",
    actor: a,
    tools: [{ toolId: "validate_facts", input: { tenant_id: "tenant-a", text: "unverified claim about tomorrow" } }],
  });
  assert.notEqual(ex.status, "SUCCEEDED");
  assert.ok(String(ex.error).includes("TRUTH"));
});

test("safe fixture can pass both engines", async () => {
  const p = new ControlPlane();
  const a = ready(p);
  const t = await p.execute({
    agentId: "AGT-008",
    actor: a,
    tools: [{ toolId: "validate_facts", input: { tenant_id: "tenant-a", text: TRUTH_SAFE_FIXTURE } }],
  });
  assert.equal(t.status, "SUCCEEDED");
  const c = await p.execute({
    agentId: "AGT-011",
    actor: a,
    tools: [{ toolId: "check_compliance", input: { tenant_id: "tenant-a", text: TRUTH_SAFE_FIXTURE } }],
  });
  assert.equal(c.status, "SUCCEEDED");
});

test("bypass_truth remains forbidden", async () => {
  const p = new ControlPlane();
  const a = admin();
  p.enableAgent("tenant-a", "AGT-026", a);
  const ex = await p.execute({
    agentId: "AGT-026",
    actor: a,
    tools: [{ toolId: "bypass_truth", input: { tenant_id: "tenant-a" } }],
  });
  assert.equal(ex.error, "FORBIDDEN_TOOL");
});
