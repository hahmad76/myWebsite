import http from "node:http";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createStorage } from "./storage.js";
import { createDatabaseAdapter } from "./database.js";
import { createPersistence } from "./database-config.js";
import { applySchema } from "./migrations.js";
import { createAuth } from "./auth.js";
import { createNotificationService } from "./notifications.js";
import { sanitizeData, validateSubmission } from "./validation.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

const config = {
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || "0.0.0.0",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  dataFile: process.env.DATA_FILE ? path.resolve(process.env.DATA_FILE) : path.join(backendRoot, "data", "db.json"),
  maxBodyBytes: Number(process.env.MAX_BODY_BYTES || 1048576),
  rateWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  rateMax: Number(process.env.RATE_LIMIT_MAX || 60),
  adminUsername: process.env.ADMIN_USERNAME || "admin",
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || "",
  sessionTtlMs: Number(process.env.SESSION_TTL_MS || 8 * 60 * 60 * 1000)
};

const SERVICES = [
  { id: "school-documentation", name: "School Documentation", category: "documents" },
  { id: "educational-forms-templates", name: "Educational Forms & Templates", category: "documents" },
  { id: "educational-design", name: "Educational Design", category: "design" },
  { id: "digital-online-support", name: "Digital & Online Support", category: "design" },
  { id: "school-support-services", name: "School Support Services", category: "school" },
  { id: "career-support", name: "Career Support", category: "career" },
  { id: "educational-content", name: "Educational Content", category: "documents" },
  { id: "custom-service-request", name: "Custom Service Request", category: "custom" }
];

const ADMIN_COLLECTIONS = [
  "serviceRequests", "teacherInterests", "schoolRequirements", "contentSubmissions", "submissions",
  "quotes", "orders", "announcements", "resources", "notifications", "auditLog"
];

function json(res, status, payload, origin) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(JSON.stringify(payload));
}

function readJson(req, maxBytes) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;
    req.setEncoding("utf8");
    req.on("data", chunk => {
      size += Buffer.byteLength(chunk);
      if (size > maxBytes) {
        reject(Object.assign(new Error("Request body too large"), { statusCode: 413 }));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on("end", () => {
      if (!body.trim()) return resolve({});
      try { resolve(JSON.parse(body)); }
      catch { reject(Object.assign(new Error("Invalid JSON"), { statusCode: 400 })); }
    });
    req.on("error", reject);
  });
}

function createRateLimiter(windowMs, maxRequests) {
  const buckets = new Map();
  return ip => {
    const now = Date.now();
    const bucket = buckets.get(ip);
    if (!bucket || now - bucket.start >= windowMs) {
      buckets.set(ip, { start: now, count: 1 });
      return true;
    }
    bucket.count += 1;
    return bucket.count <= maxRequests;
  };
}

function recordFor(type, data) {
  return { id: crypto.randomUUID(), type, data, status: "received", createdAt: new Date().toISOString() };
}

function collectionFromPath(pathname) {
  const match = pathname.match(/^\/api\/admin\/collections\/([A-Za-z0-9_-]+)$/);
  return match?.[1] || null;
}

function idFromPatchPath(pathname) {
  const match = pathname.match(/^\/api\/admin\/collections\/([A-Za-z0-9_-]+)\/([^/]+)$/);
  return match ? { collection: match[1], id: match[2] } : null;
}

function allowedAdminPatch(body) {
  const allowed = ["status", "read", "notes", "assignedTo", "amount_minor", "currency", "title", "description", "category"];
  return Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));
}

export function createApp({ storage, persistence, configOverride = {} } = {}) {
  const cfg = { ...config, ...configOverride };
  const store = persistence || storage || createStorage(cfg.dataFile);
  const db = store.list && store.append && !store.collections ? createDatabaseAdapter(store) : store;
  const persistenceMode = db.collections?.sessions ? "sql" : "json";
  const auth = createAuth({ ...cfg, storage: db });
  const notifications = createNotificationService(db);
  const allowRequest = createRateLimiter(cfg.rateWindowMs, cfg.rateMax);
  const requireAdmin = req => auth.authenticate(req);

  async function handler(req, res) {
    const origin = cfg.corsOrigin;
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    if (req.method === "OPTIONS") return json(res, 204, {}, origin);
    if (!allowRequest(ip)) return json(res, 429, { success: false, error: "Too many requests" }, origin);
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    try {
      if (req.method === "GET" && url.pathname === "/api/health") {
        if (db.ensureFile) await db.ensureFile();
        if (persistenceMode === "sql") await db.list("users");
        return json(res, 200, { success: true, service: "SCHOOLS SOLUTIONS HUB PAKISTAN API", status: "ok", version: "1.0.0", persistence: persistenceMode, timestamp: new Date().toISOString() }, origin);
      }
      if (req.method === "GET" && url.pathname === "/api/services") return json(res, 200, { success: true, data: SERVICES }, origin);

      if (req.method === "POST" && url.pathname === "/api/auth/login") {
        const result = await auth.login(await readJson(req, cfg.maxBodyBytes));
        if (!result) return json(res, 401, { success: false, error: "Invalid administrator credentials or authentication is not configured." }, origin);
        return json(res, 200, { success: true, data: result }, origin);
      }
      if (req.method === "POST" && url.pathname === "/api/auth/logout") {
        await auth.logout(req);
        return json(res, 200, { success: true }, origin);
      }
      if (req.method === "GET" && url.pathname === "/api/auth/me") {
        const user = await requireAdmin(req);
        if (!user) return json(res, 401, { success: false, error: "Authentication required" }, origin);
        return json(res, 200, { success: true, data: { username: user.username, role: user.role, expiresAt: new Date(user.expiresAt).toISOString() } }, origin);
      }

      const collectionRoutes = { "/api/resources": "resources", "/api/announcements": "announcements" };
      if (req.method === "GET" && collectionRoutes[url.pathname]) {
        const data = await db.list(collectionRoutes[url.pathname]);
        return json(res, 200, { success: true, data }, origin);
      }

      if (url.pathname.startsWith("/api/admin/")) {
        const user = await requireAdmin(req);
        if (!user) return json(res, 401, { success: false, error: "Administrator authentication required" }, origin);

        if (req.method === "GET" && url.pathname === "/api/admin/dashboard") {
          const counts = {};
          for (const collection of ADMIN_COLLECTIONS) counts[collection] = (await db.list(collection)).length;
          return json(res, 200, { success: true, data: { counts, generatedAt: new Date().toISOString() } }, origin);
        }
        if (req.method === "GET" && url.pathname === "/api/admin/notifications") {
          const data = await db.list("notifications");
          return json(res, 200, { success: true, data: data.slice(-100).reverse() }, origin);
        }
        if (req.method === "GET") {
          const collection = collectionFromPath(url.pathname);
          if (collection && ADMIN_COLLECTIONS.includes(collection)) {
            const data = await db.list(collection);
            return json(res, 200, { success: true, data: data.slice(-200).reverse() }, origin);
          }
        }
        if (req.method === "PATCH") {
          const target = idFromPatchPath(url.pathname);
          if (!target || !ADMIN_COLLECTIONS.includes(target.collection)) return json(res, 404, { success: false, error: "Administrative collection not found" }, origin);
          const body = allowedAdminPatch(sanitizeData(await readJson(req, cfg.maxBodyBytes)));
          if (!Object.keys(body).length) return json(res, 422, { success: false, error: "No permitted fields supplied" }, origin);
          const updated = await db.update(target.collection, target.id, body);
          if (!updated) return json(res, 404, { success: false, error: "Record not found" }, origin);
          await db.append("auditLog", { id: crypto.randomUUID(), action: "admin.record.updated", entityId: target.id, type: target.collection, actor: user.username, metadata: body, createdAt: new Date().toISOString() });
          return json(res, 200, { success: true, data: updated }, origin);
        }
      }

      if (req.method === "POST") {
        const routeMap = {
          "/api/service-requests": ["Service Request", "serviceRequests"],
          "/api/teacher-interests": ["Teacher Career Interest", "teacherInterests"],
          "/api/school-requirements": ["Private School Requirement", "schoolRequirements"],
          "/api/content-submissions": ["Community Content Contribution", "contentSubmissions"],
          "/api/submissions": [null, "submissions"]
        };
        if (routeMap[url.pathname]) {
          const [routeType, collection] = routeMap[url.pathname];
          const body = await readJson(req, cfg.maxBodyBytes);
          const type = routeType || String(body.type || "Website Form");
          const data = sanitizeData(routeType ? body : body.data);
          const errors = validateSubmission(type, data);
          if (errors.length) return json(res, 422, { success: false, error: "Validation failed", details: errors }, origin);
          const record = recordFor(type, data);
          await db.append(collection, record);
          await db.append("auditLog", { id: crypto.randomUUID(), action: "submission.received", entityId: record.id, type, createdAt: record.createdAt });
          await notifications.create({ type: "new-submission", title: "New website submission", message: `${type} received from ${data.name || data.school || "website user"}.`, entityId: record.id });
          return json(res, 201, { success: true, message: "Submission received successfully.", data: { id: record.id, status: record.status, createdAt: record.createdAt } }, origin);
        }

        if (url.pathname === "/api/quotes") {
          const body = sanitizeData(await readJson(req, cfg.maxBodyBytes));
          const errors = [];
          for (const field of ["service", "name", "phone"]) if (!body[field]) errors.push(`${field} is required`);
          if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push("email is invalid");
          if (errors.length) return json(res, 422, { success: false, error: "Validation failed", details: errors }, origin);
          const record = { id: crypto.randomUUID(), ...body, status: "requested", createdAt: new Date().toISOString() };
          await db.append("quotes", record);
          await notifications.create({ type: "new-quote", title: "New quote request", message: `Quote requested for ${body.service}.`, entityId: record.id });
          return json(res, 201, { success: true, message: "Quote request received successfully.", data: record }, origin);
        }

        if (url.pathname === "/api/orders") {
          const body = sanitizeData(await readJson(req, cfg.maxBodyBytes));
          const errors = [];
          for (const field of ["service", "name", "phone"]) if (!body[field]) errors.push(`${field} is required`);
          if (errors.length) return json(res, 422, { success: false, error: "Validation failed", details: errors }, origin);
          const record = { id: crypto.randomUUID(), ...body, status: "pending", createdAt: new Date().toISOString() };
          await db.append("orders", record);
          await notifications.create({ type: "new-order", title: "New service order", message: `Order received for ${body.service}.`, entityId: record.id });
          return json(res, 201, { success: true, message: "Order received successfully.", data: record }, origin);
        }
      }

      return json(res, 404, { success: false, error: "Route not found" }, origin);
    } catch (error) {
      const status = Number(error.statusCode) || 500;
      console.error(error);
      return json(res, status, { success: false, error: status === 500 ? "Internal server error" : error.message }, origin);
    }
  }

  return { handler, store: db, db, auth };
}

export async function startServer() {
  let sqlClient = null;
  let pool = null;
  if (process.env.DATABASE_URL) {
    const { Pool } = await import("pg");
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: Number(process.env.DB_POOL_MAX || 10), idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000) });
    await pool.query("SELECT 1");
    await applySchema(pool);
    sqlClient = pool;
  }

  const persistence = createPersistence({ env: process.env, sqlClient });
  const app = createApp({ persistence });
  if (persistence.ensureFile) await persistence.ensureFile();
  const server = http.createServer(app.handler);
  server.on("close", async () => { if (pool) await pool.end(); });
  server.listen(config.port, config.host, () => console.log(`SSHP backend listening on http://${config.host}:${config.port} using ${process.env.DATABASE_URL ? "SQL" : "JSON"} persistence`));
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) startServer();
