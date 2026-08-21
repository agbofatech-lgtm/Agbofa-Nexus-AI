import assert from "node:assert/strict";
import { test } from "node:test";
import { TEST_BEARER, allowPlaneTestAuth } from "./testauth.ts";

test("no token is rejected", () => {
  assert.equal(allowPlaneTestAuth("test", true, ""), false);
});

test("invalid token is rejected even in test mode", () => {
  assert.equal(allowPlaneTestAuth("test", true, "not-the-test-token"), false);
});

test("test token accepted only when PLANE_TEST_AUTH and non-production", () => {
  assert.equal(allowPlaneTestAuth("test", true, TEST_BEARER), true);
  assert.equal(allowPlaneTestAuth("development", true, TEST_BEARER), true);
});

test("test token rejected in production and staging", () => {
  assert.equal(allowPlaneTestAuth("production", true, TEST_BEARER), false);
  assert.equal(allowPlaneTestAuth("staging", true, TEST_BEARER), false);
});

test("test token rejected when plane test auth is off", () => {
  assert.equal(allowPlaneTestAuth("test", false, TEST_BEARER), false);
});
