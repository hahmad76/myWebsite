import test from "node:test";
import assert from "node:assert/strict";
import { readProductionSchema } from "../src/migrations.js";

test("production schema is available for migration", async () => {
  const schema = await readProductionSchema();
  assert.match(schema, /CREATE TABLE users/i);
  assert.match(schema, /CREATE TABLE sessions/i);
  assert.match(schema, /CREATE TABLE orders/i);
});
