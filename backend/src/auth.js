import crypto from "node:crypto";

const sessions = new Map();

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

  function login(input) {
    if (!storedHash || input?.username !== username || typeof input?.password !== "string" || !verifyPassword(input.password, storedHash)) return null;
    const token = crypto.randomBytes(32).toString("base64url");
    sessions.set(token, { username, role: "admin", expiresAt: Date.now() + sessionTtlMs });
    return { token, expiresAt: new Date(Date.now() + sessionTtlMs).toISOString(), user: { username, role: "admin" } };
  }

  function authenticate(req) {
    const header = String(req.headers.authorization || "");
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) return null;
    const session = sessions.get(token);
    if (!session) return null;
    if (session.expiresAt <= Date.now()) {
      sessions.delete(token);
      return null;
    }
    return { ...session, token };
  }

  function logout(req) {
    const user = authenticate(req);
    if (user) sessions.delete(user.token);
    return Boolean(user);
  }

  return { login, authenticate, logout, hashPassword };
}

export { hashPassword };
