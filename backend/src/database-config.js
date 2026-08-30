import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSqlAdapter } from "./sql-adapter.js";
import { createStorage } from "./storage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDataFile = path.resolve(__dirname, "../data/db.json");

export function createPersistence({ env = process.env, sqlClient } = {}) {
  if (env.DATABASE_URL) {
    if (!sqlClient) throw new Error("DATABASE_URL is configured but no SQL client was supplied");
    return createSqlAdapter({ client: sqlClient, transaction: true });
  }
  if (env.NODE_ENV === "production") throw new Error("Production requires DATABASE_URL and a configured SQL client");
  return createStorage(env.DATA_FILE ? path.resolve(env.DATA_FILE) : defaultDataFile);
}
