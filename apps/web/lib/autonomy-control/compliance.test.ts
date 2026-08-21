import assert from "node:assert/strict";
import { test } from "node:test";
import { COMPLIANCE_SAFE_FIXTURE, ComplianceUnavailable, DevComplianceEngine } from "./compliance.ts";

test("compliant fixture passes development rules", () => {
  const r = new DevComplianceEngine().check(COMPLIANCE_SAFE_FIXTURE);
  assert.equal(r.ok, true);
  assert.equal(r.error, undefined);
});

test("prohibited term fails", () => {
  const r = new DevComplianceEngine().check("this is a prohibited:unlicensed-medical-claim");
  assert.equal(r.ok, false);
  assert.equal(r.error, undefined);
});

test("supported PII email fails", () => {
  const r = new DevComplianceEngine().check("email me at person@example.com please");
  assert.equal(r.ok, false);
});

test("supported SSN-like pattern fails", () => {
  const r = new DevComplianceEngine().check("ssn 123-45-6789");
  assert.equal(r.ok, false);
});

test("empty content is unavailable not compliant", () => {
  const r = new DevComplianceEngine().check("  ");
  assert.equal(r.ok, false);
  assert.ok(r.error instanceof ComplianceUnavailable);
});

test("deterministic repeats", () => {
  const e = new DevComplianceEngine();
  assert.deepEqual(e.check(COMPLIANCE_SAFE_FIXTURE), e.check(COMPLIANCE_SAFE_FIXTURE));
});
