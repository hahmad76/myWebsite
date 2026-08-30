import test from "node:test";
import assert from "node:assert/strict";
import { createSqlAdapter } from "../src/sql-adapter.js";

function mockClient() {
  const calls = [];
  return {
    calls,
    async query(text, params = []) {
      calls.push({ text, params });
      if (text.startsWith("SELECT")) return { rows: [] };
      if (text.startsWith("INSERT")) return { rows: [{ id: params[0] }] };
      if (text.startsWith("UPDATE")) return { rows: [{ id: params[0], status: params[1] }] };
      return { rows: [] };
    }
  };
}

test("SQL adapter uses an allow-listed table and parameterized values", async () => {
  const client = mockClient();
  const db = createSqlAdapter({ client });
  await db.append("serviceRequests", { id: "abc", service: "School Documentation", name: "A", phone: "+923001234567" });
  const call = client.calls[0];
  assert.match(call.text, /^INSERT INTO service_requests/);
  assert.ok(call.text.includes("$1"));
  assert.ok(call.params.includes("abc"));
  assert.equal(call.text.includes("School Documentation"), false);
});

test("SQL adapter rejects unknown collections", async () => {
  const db = createSqlAdapter({ client: mockClient() });
  await assert.rejects(() => db.list("not_allowed"), /Unknown collection/);
});
