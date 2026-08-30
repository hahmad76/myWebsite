import test from "node:test";
import assert from "node:assert/strict";
import { validateProductionConfig } from "../src/production-config.js";

test("production configuration rejects unsafe defaults", () => {
  const errors = validateProductionConfig({ NODE_ENV: "production", CORS_ORIGIN: "*" });
  assert.ok(errors.some(error => error.includes("CORS_ORIGIN")));
  assert.ok(errors.some(error => error.includes("ADMIN_PASSWORD_HASH")));
  assert.ok(errors.some(error => error.includes("DATABASE_URL")));
});

test("production configuration accepts required secure settings", () => {
  assert.deepEqual(validateProductionConfig({
    NODE_ENV: "production",
    CORS_ORIGIN: "https://example.org",
    ADMIN_PASSWORD_HASH: "salt:hash",
    DATABASE_URL: "postgres://redacted"
  }), []);
});
