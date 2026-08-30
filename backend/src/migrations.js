import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, "../data/schema.sql");

export async function readProductionSchema() {
  return fs.readFile(schemaPath, "utf8");
}

export async function applySchema(client) {
  if (!client || typeof client.query !== "function") throw new TypeError("SQL client with query() is required");
  const schema = await readProductionSchema();
  await client.query(schema);
  return { applied: true, schemaPath };
}

export async function migrateJsonCollections({ storage, sqlAdapter, collections }) {
  if (!storage || !sqlAdapter) throw new TypeError("storage and sqlAdapter are required");
  const names = collections || Object.keys((await storage.read()));
  const summary = {};
  for (const collection of names) {
    const rows = await storage.list(collection);
    if (!rows.length) { summary[collection] = 0; continue; }
    for (const row of rows) await sqlAdapter.append(collection, row);
    summary[collection] = rows.length;
  }
  return summary;
}
