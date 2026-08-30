import crypto from "node:crypto";
import { createSessionStore } from "./session-store.js";

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, expected] = String(stored || "").split(":");
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return actual.length === expected.length && crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export function createAuth(config = {}) {
  const username = config.adminUsername || process.env.ADMIN_USERNAME || "admin";
  const storedHash = config.adminPasswordHash || process.env.ADMIN_PASSWORD_HASH || "";
  const sessionTtlMs = Number(config.sessionTtlMs || process.env.SESSION_TTL_MS || 8 * 60 * 60 * 1000);
  const sessionStore = config.sessionStore || createSessionStore({ storage: config.storage, ttlMs: sessionTtlMs });

  async function login(input) {
    if (!storedHash || input?.username !== username || typeof input?.password !== "string" || !verifyPassword(input.password, storedHash)) return null;
    const session = await sessionStore.create({ username, role: "admin" });
    return {
      token: session.token,
      expiresAt: new Date(session.expiresAt).toISOString(),
      user: { username, role: "admin" }
    };
  }

  async function authenticate(req) {
    const header = String(req.headers.authorization || "");
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) return null;
    const session = await sessionStore.get(token);
    if (!session) return null;
    return session;
  }

  async function logout(req) {
    const user = await authenticate(req);
    if (user) await sessionStore.remove(user.token);
    return Boolean(user);
  }

  return { login, authenticate, logout, hashPassword, sessionStore };
}

export { hashPassword };
