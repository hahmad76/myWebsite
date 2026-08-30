import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createApp } from "../src/server.js";
import { createStorage } from "../src/storage.js";
import { hashPassword } from "../src/auth.js";

async function request(server, method, pathname, body, token) {
  const address = server.address();
  const payload = body === undefined ? undefined : JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const headers = payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const req = http.request({ hostname: "127.0.0.1", port: address.port, path: pathname, method, headers }, res => {
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

async function makeServer() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sshp-"));
  const storage = createStorage(path.join(tempDir, "db.json"));
  const app = createApp({
    storage,
    configOverride: {
      rateMax: 100,
      adminUsername: "principal",
      adminPasswordHash: hashPassword("TestPassword!123")
    }
  });
  const server = http.createServer(app.handler);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  return { server, storage, tempDir };
}

async function closeServer(server, tempDir) {
  await new Promise(resolve => server.close(resolve));
  await fs.rm(tempDir, { recursive: true, force: true });
}

test("quote and order APIs persist requests", async () => {
  const { server, storage, tempDir } = await makeServer();
  const quote = await request(server, "POST", "/api/quotes", {
    service: "School Documentation", name: "Test User", phone: "+923001234567", email: "test@example.com"
  });
  assert.equal(quote.status, 201);
  const order = await request(server, "POST", "/api/orders", {
    service: "Educational Design", name: "Test User", phone: "+923001234567"
  });
  assert.equal(order.status, 201);
  assert.equal((await storage.list("quotes")).length, 1);
  assert.equal((await storage.list("orders")).length, 1);
  assert.equal((await storage.list("notifications")).length, 2);
  await closeServer(server, tempDir);
});

test("administrator login protects dashboard and exposes counts", async () => {
  const { server, tempDir } = await makeServer();
  const denied = await request(server, "GET", "/api/admin/dashboard");
  assert.equal(denied.status, 401);

  const login = await request(server, "POST", "/api/auth/login", { username: "principal", password: "TestPassword!123" });
  assert.equal(login.status, 200);
  assert.ok(login.body.data.token);

  const dashboard = await request(server, "GET", "/api/admin/dashboard", undefined, login.body.data.token);
  assert.equal(dashboard.status, 200);
  assert.equal(typeof dashboard.body.data.counts.serviceRequests, "number");
  await closeServer(server, tempDir);
});
