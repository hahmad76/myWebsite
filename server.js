import http from "node:http";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createStorage } from "./storage.js";
import { sanitizeData, validateSubmission } from "./validation.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

const config = {
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || "0.0.0.0",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  dataFile: process.env.DATA_FILE
    ? path.resolve(process.env.DATA_FILE)
    : path.join(backendRoot, "data", "db.json"),
  maxBodyBytes: Number(process.env.MAX_BODY_BYTES || 1048576),
  rateWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  rateMax: Number(process.env.RATE_LIMIT_MAX || 60)
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

function json(res, status, payload, origin) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
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
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(Object.assign(new Error("Invalid JSON"), { statusCode: 400 }));
      }
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
  return {
    id: crypto.randomUUID(),
    type,
    data,
    status: "received",
    createdAt: new Date().toISOString()
  };
}

export function createApp({ storage, configOverride = {} } = {}) {
  const cfg = { ...config, ...configOverride };
  const store = storage || createStorage(cfg.dataFile);
  const allowRequest = createRateLimiter(cfg.rateWindowMs, cfg.rateMax);

  async function handler(req, res) {
    const origin = cfg.corsOrigin;
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";

    if (req.method === "OPTIONS") {
      return json(res, 204, {}, origin);
    }

    if (!allowRequest(ip)) {
      return json(res, 429, { success: false, error: "Too many requests" }, origin);
    }

    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    try {
      if (req.method === "GET" && url.pathname === "/api/health") {
        await store.ensureFile();
        return json(res, 200, {
          success: true,
          service: "SCHOOLS SOLUTIONS HUB PAKISTAN API",
          status: "ok",
          version: "1.0.0",
          timestamp: new Date().toISOString()
        }, origin);
      }

      if (req.method === "GET" && url.pathname === "/api/services") {
        return json(res, 200, { success: true, data: SERVICES }, origin);
      }

      const collectionRoutes = {
        "/api/resources": "resources",
        "/api/announcements": "announcements"
      };
      if (req.method === "GET" && collectionRoutes[url.pathname]) {
        const data = await store.list(collectionRoutes[url.pathname]);
        return json(res, 200, { success: true, data }, origin);
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

          if (errors.length) {
            return json(res, 422, { success: false, error: "Validation failed", details: errors }, origin);
          }

          const record = recordFor(type, data);
          await store.append(collection, record);
          await store.append("auditLog", {
            id: crypto.randomUUID(),
            action: "submission.received",
            entityId: record.id,
            type,
            createdAt: record.createdAt
          });

          return json(res, 201, {
            success: true,
            message: "Submission received successfully.",
            data: { id: record.id, status: record.status, createdAt: record.createdAt }
          }, origin);
        }
      }

      return json(res, 404, { success: false, error: "Route not found" }, origin);
    } catch (error) {
      const status = Number(error.statusCode) || 500;
      console.error(error);
      return json(res, status, {
        success: false,
        error: status === 500 ? "Internal server error" : error.message
      }, origin);
    }
  }

  return { handler, store };
}

export async function startServer() {
  const app = createApp();
  await app.store.ensureFile();
  const server = http.createServer(app.handler);
  server.listen(config.port, config.host, () => {
    console.log(`SSHP backend listening on http://${config.host}:${config.port}`);
  });
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
