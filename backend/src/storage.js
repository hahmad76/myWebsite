import fs from "node:fs/promises";
import path from "node:path";

const EMPTY_STORE = {
  serviceRequests: [],
  teacherInterests: [],
  schoolRequirements: [],
  contentSubmissions: [],
  submissions: [],
  quotes: [],
  orders: [],
  announcements: [],
  resources: [],
  notifications: [],
  users: [],
  sessions: [],
  auditLog: []
};

function cloneEmptyStore() {
  return JSON.parse(JSON.stringify(EMPTY_STORE));
}

export function createStorage(filePath) {
  let writeChain = Promise.resolve();

  async function ensureFile() {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    try { await fs.access(filePath); }
    catch { await fs.writeFile(filePath, JSON.stringify(cloneEmptyStore(), null, 2), "utf8"); }
  }

  async function read() {
    await ensureFile();
    const raw = await fs.readFile(filePath, "utf8");
    if (!raw.trim()) return cloneEmptyStore();
    const parsed = JSON.parse(raw);
    return { ...cloneEmptyStore(), ...parsed };
  }

  async function write(store) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const temp = `${filePath}.tmp`;
    await fs.writeFile(temp, JSON.stringify(store, null, 2), "utf8");
    await fs.rename(temp, filePath);
  }

  async function append(collection, record) {
    writeChain = writeChain.then(async () => {
      const store = await read();
      if (!Array.isArray(store[collection])) store[collection] = [];
      store[collection].push(record);
      await write(store);
    });
    await writeChain;
    return record;
  }

  async function replace(collection, records) {
    writeChain = writeChain.then(async () => {
      const store = await read();
      store[collection] = Array.isArray(records) ? records : [];
      await write(store);
    });
    await writeChain;
    return records;
  }

  async function list(collection) {
    const store = await read();
    return Array.isArray(store[collection]) ? store[collection] : [];
  }

  return { ensureFile, read, write, append, replace, list };
}
