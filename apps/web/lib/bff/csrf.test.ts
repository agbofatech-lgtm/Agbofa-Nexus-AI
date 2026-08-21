import assert from "node:assert/strict";
import { test } from "node:test";
import { tokensMatch } from "./csrf-core.ts";
import { clientLimitKey, rateLimit, resetRateLimitForTests } from "./limits-core.ts";

test("CSRF tokens must match constantly", () => {
  assert.equal(tokensMatch("abc", "abc"), true);
  assert.equal(tokensMatch("abc", "abd"), false);
  assert.equal(tokensMatch("", "abc"), false);
});

test("rate limit identity is not X-Forwarded-For", () => {
  assert.equal(clientLimitKey({ subject: "user-1" }), "sub:user-1");
  assert.equal(clientLimitKey({ userAgent: "Mozilla" }), "anon:ua:Mozilla");
  assert.notEqual(clientLimitKey({ userAgent: "Mozilla" }), "1.2.3.4");
});

test("rate limit rejects after window count", () => {
  resetRateLimitForTests();
  assert.equal(rateLimit("t", 2, 60_000), true);
  assert.equal(rateLimit("t", 2, 60_000), true);
  assert.equal(rateLimit("t", 2, 60_000), false);
});
