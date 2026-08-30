import crypto from "node:crypto";

export function createSessionStore({ storage, ttlMs = 8 * 60 * 60 * 1000 } = {}) {
  const memory = new Map();
  const persistent = Boolean(storage);

  async function create(session) {
    const token = crypto.randomBytes(32).toString("base64url");
    const record = { token, ...session, expiresAt: Date.now() + ttlMs };
    if (persistent) {
      await storage.append("sessions", {
        id: token,
        username: record.username,
        role: record.role,
        expiresAt: record.expiresAt,
        createdAt: new Date().toISOString()
      });
    }
    memory.set(token, record);
    return record;
  }

  async function get(token) {
    if (!token) return null;
    const local = memory.get(token);
    if (local) {
      if (local.expiresAt <= Date.now()) { memory.delete(token); return null; }
      return local;
    }
    if (!persistent) return null;
    const rows = await storage.list("sessions");
    const row = rows.find(item => item.id === token);
    if (!row || row.expiresAt <= Date.now()) return null;
    const record = { token, username: row.username, role: row.role, expiresAt: row.expiresAt };
    memory.set(token, record);
    return record;
  }

  async function remove(token) {
    memory.delete(token);
    if (!persistent) return;
    const rows = await storage.list("sessions");
    await storage.replace("sessions", rows.filter(item => item.id !== token));
  }

  return { create, get, remove };
}
