import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createApp } from "./src/server.js";
import { createStorage } from "./src/storage.js";
import { hashPassword } from "./src/auth.js";

async function makeServer(configOverride = {}) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sshp-"));
  const storage = createStorage(path.join(tempDir, "db.json"));
  const app = createApp({ storage, configOverride: { rateMax: 100, ...configOverride } });
  const server = http.createServer(app.handler);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  return { server, storage, tempDir };
}

async function closeServer(server, tempDir) {
  await new Promise(resolve => server.close(resolve));
  await fs.rm(tempDir, { recursive: true, force: true });
}

async function request(server, method, pathname, body, headers = {}) {
  const address = server.address();
  const payload = body === undefined ? undefined : JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: "127.0.0.1",
      port: address.port,
      path: pathname,
      method,
      headers: {
        ...(payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}),
        ...headers
      }
    }, res => {
      let text = "";
      res.setEncoding("utf8");
      res.on("data", chunk => text += chunk);
      res.on("end", () => resolve({ status: res.statusCode, body: text ? JSON.parse(text) : {} }));
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test("health endpoint reports persistence mode", async () => {
  const { server, tempDir } = await makeServer();
  try {
    const result = await request(server, "GET", "/api/health");
    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
    assert.equal(result.body.status, "ok");
    assert.equal(result.body.persistence, "json");
  } finally { await closeServer(server, tempDir); }
});

test("all public submission pathways validate and persist", async () => {
  const { server, storage, tempDir } = await makeServer();
  try {
    const cases = [
      ["/api/service-requests", { service_select:"School Documentation", name:"Test User", phone:"+923001234567", requirement:"Test request" }],
      ["/api/teacher-interests", { name:"Teacher User", phone:"+923001234568", qualification:"BS", subject:"Mathematics", opportunity:"Teaching" }],
      ["/api/school-requirements", { school:"Test School", contact:"Admin", phone:"+923001234569", location:"Swat", type:"Teacher Recruitment", details:"Need teacher" }],
      ["/api/content-submissions", { title:"Resource", category:"Teaching", description:"Useful resource", name:"Contributor", email:"test@example.com" }],
      ["/api/submissions", { type:"Website Form", data:{ name:"Generic User", phone:"+923001234570" } }]
    ];
    for (const [route, body] of cases) assert.equal((await request(server, "POST", route, body)).status, 201);
    assert.equal((await storage.list("serviceRequests")).length, 1);
    assert.equal((await storage.list("teacherInterests")).length, 1);
    assert.equal((await storage.list("schoolRequirements")).length, 1);
    assert.equal((await storage.list("contentSubmissions")).length, 1);
    assert.equal((await storage.list("submissions")).length, 1);
    assert.equal((await storage.list("notifications")).length, 5);
    assert.equal((await storage.list("auditLog")).length, 5);
  } finally { await closeServer(server, tempDir); }
});

test("quote and order pathways persist correctly", async () => {
  const { server, storage, tempDir } = await makeServer();
  try {
    const quote = await request(server, "POST", "/api/quotes", { service:"School Documentation", name:"Customer", phone:"+923001234571", email:"customer@example.com" });
    const order = await request(server, "POST", "/api/orders", { service:"Educational Design", name:"Customer", phone:"+923001234571", amount_minor:5000, currency:"PKR" });
    assert.equal(quote.status, 201);
    assert.equal(order.status, 201);
    assert.equal((await storage.list("quotes")).length, 1);
    assert.equal((await storage.list("orders")).length, 1);
  } finally { await closeServer(server, tempDir); }
});

test("Omni payment requires valid fields and starts pending verification", async () => {
  const { server, storage, tempDir } = await makeServer();
  try {
    const invalid = await request(server, "POST", "/api/payments", { order_id:"ORD-1", method:"omni" });
    assert.equal(invalid.status, 422);
    const result = await request(server, "POST", "/api/payments", {
      order_id:"ORD-1", method:"omni", transaction_reference:"OMNI-123456",
      sender_name:"Test Payer", sender_phone:"+923001234572", amount_minor:2500, currency:"PKR", notes:"Experimental payment"
    });
    assert.equal(result.status, 201);
    assert.equal(result.body.data.status, "pending_verification");
    const payments = await storage.list("payments");
    assert.equal(payments.length, 1);
    assert.equal(payments[0].status, "pending_verification");
    assert.equal((await storage.list("notifications")).length, 1);
    assert.equal((await storage.list("auditLog")).length, 1);
  } finally { await closeServer(server, tempDir); }
});

test("Omni payment rejects unsupported method, invalid amount and invalid currency", async () => {
  const { server, tempDir } = await makeServer();
  try {
    const base = { order_id:"ORD-2", transaction_reference:"REF", sender_name:"Payer", sender_phone:"+923001234573" };
    assert.equal((await request(server, "POST", "/api/payments", { ...base, method:"bank", amount_minor:100, currency:"PKR" })).status, 422);
    assert.equal((await request(server, "POST", "/api/payments", { ...base, method:"omni", amount_minor:0, currency:"PKR" })).status, 422);
    assert.equal((await request(server, "POST", "/api/payments", { ...base, method:"omni", amount_minor:100, currency:"PK" })).status, 422);
  } finally { await closeServer(server, tempDir); }
});

test("administrator can authenticate and verify an Omni payment", async () => {
  const passwordHash = hashPassword("TestAdminPassword!");
  const { server, storage, tempDir } = await makeServer({ adminUsername:"admin", adminPasswordHash:passwordHash });
  try {
    const payment = await request(server, "POST", "/api/payments", { order_id:"ORD-3", method:"omni", transaction_reference:"REF-3", sender_name:"Payer", sender_phone:"+923001234574", amount_minor:3000, currency:"PKR" });
    const login = await request(server, "POST", "/api/auth/login", { username:"admin", password:"TestAdminPassword!" });
    assert.equal(login.status, 200);
    const token = login.body.data.token;
    const list = await request(server, "GET", "/api/admin/collections/payments", undefined, { Authorization:`Bearer ${token}` });
    assert.equal(list.status, 200);
    const id = payment.body.data.id;
    const verify = await request(server, "PATCH", `/api/admin/collections/payments/${encodeURIComponent(id)}`, { status:"verified" }, { Authorization:`Bearer ${token}` });
    assert.equal(verify.status, 200);
    assert.equal(verify.body.data.status, "verified");
    assert.equal((await storage.list("auditLog")).length, 2);
  } finally { await closeServer(server, tempDir); }
});

test("protected admin endpoint rejects unauthenticated access", async () => {
  const { server, tempDir } = await makeServer();
  try { assert.equal((await request(server, "GET", "/api/admin/dashboard")).status, 401); }
  finally { await closeServer(server, tempDir); }
});

test("production mode rejects wildcard CORS", () => {
  assert.throws(() => createApp({ storage:createStorage(path.join(os.tmpdir(), `sshp-${Date.now()}.json`)), configOverride:{ nodeEnv:"production", corsOrigin:"*" } }), /explicit CORS_ORIGIN/);
});
