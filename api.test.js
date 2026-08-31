import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createApp } from "./backend/src/server.js";
import { createStorage } from "./backend/src/storage.js";

async function request(server, method, pathname, body) {
  const address = server.address();
  const payload = body === undefined ? undefined : JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: "127.0.0.1",
      port: address.port,
      path: pathname,
      method,
      headers: payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}
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

test("health endpoint reports ok", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sshp-"));
  const storage = createStorage(path.join(tempDir, "db.json"));
  const app = createApp({ storage, configOverride: { rateMax: 100 } });
  const server = http.createServer(app.handler);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));

  const result = await request(server, "GET", "/api/health");
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(result.body.status, "ok");

  await new Promise(resolve => server.close(resolve));
  await fs.rm(tempDir, { recursive: true, force: true });
});

test("service request is validated and persisted", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sshp-"));
  const storage = createStorage(path.join(tempDir, "db.json"));
  const app = createApp({ storage, configOverride: { rateMax: 100 } });
  const server = http.createServer(app.handler);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));

  const result = await request(server, "POST", "/api/service-requests", {
    service_select: "School Documentation",
    name: "Test User",
    phone: "+923001234567",
    requirement: "Test request"
  });

  assert.equal(result.status, 201);
  const saved = await storage.list("serviceRequests");
  assert.equal(saved.length, 1);
  assert.equal(saved[0].type, "Service Request");
  assert.equal(saved[0].data.name, "Test User");

  await new Promise(resolve => server.close(resolve));
  await fs.rm(tempDir, { recursive: true, force: true });
});
