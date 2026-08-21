import assert from "node:assert/strict";
import { test } from "node:test";
import { DevTruthEngine, TRUTH_SAFE_FIXTURE, TruthUnavailable } from "./truth.ts";

test("safe fixture verifies", () => {
  const r = new DevTruthEngine().verify(TRUTH_SAFE_FIXTURE);
  assert.equal(r.ok, true);
  assert.equal(r.error, undefined);
});

test("known-false claim fails without treating as unknown", () => {
  const r = new DevTruthEngine().verify("the earth is flat");
  assert.equal(r.ok, false);
  assert.equal(r.error, undefined);
});

test("empty and whitespace are unavailable, not true", () => {
  for (const input of ["", "   ", "\n\t"]) {
    const r = new DevTruthEngine().verify(input);
    assert.equal(r.ok, false);
    assert.ok(r.error instanceof TruthUnavailable);
  }
});

test("unknown claim is not verified", () => {
  const r = new DevTruthEngine().verify("unverified claim about tomorrow");
  assert.equal(r.ok, false);
  assert.ok(r.error instanceof TruthUnavailable);
});

test("deterministic repeats", () => {
  const e = new DevTruthEngine();
  assert.deepEqual(e.verify(TRUTH_SAFE_FIXTURE), e.verify(TRUTH_SAFE_FIXTURE));
  assert.deepEqual(e.verify("2+2=5"), e.verify("2+2=5"));
});
