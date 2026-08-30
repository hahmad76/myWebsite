import { assertSqlAdapter, SQL_COLLECTION_MAP } from "./sql-adapter.contract.js";

export function createSqlAdapter({ client, transaction = false } = {}) {
  if (!client || typeof client.query !== "function") throw new TypeError("A SQL client with query() is required");

  const table = collection => {
    const name = SQL_COLLECTION_MAP[collection];
    if (!name) throw new Error(`Unknown collection: ${collection}`);
    return name;
  };

  const columns = {
    serviceRequests: ["id","service","name","phone","email","requirement","action","status","created_at","updated_at"],
    teacherInterests: ["id","name","phone","qualification","subject","opportunity","details","status","created_at","updated_at"],
    schoolRequirements: ["id","school","contact","phone","location","type","details","status","created_at","updated_at"],
    contentSubmissions: ["id","title","category","description","name","email","phone","status","created_at","updated_at"],
    submissions: ["id","type","data","status","created_at"],
    quotes: ["id","service_request_id","customer_name","phone","email","service","amount_minor","currency","notes","status","created_at","updated_at"],
    orders: ["id","quote_id","customer_name","phone","email","service","amount_minor","currency","status","created_at","updated_at"],
    announcements: ["id","title","category","description","status","created_at","updated_at"],
    resources: ["id","title","category","description","status","created_at","updated_at"],
    notifications: ["id","type","title","message","recipient","entity_id","read","created_at"],
    users: ["id","username","password_hash","role","status","created_at","updated_at"],
    sessions: ["id","username","role","expires_at","created_at"],
    auditLog: ["id","action","entity_id","type","actor","metadata","created_at"]
  };

  const jsonColumns = new Set(["data", "metadata"]);

  function toDbRecord(collection, record) {
    const result = {};
    for (const column of columns[collection] || []) {
      const source = column.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (Object.prototype.hasOwnProperty.call(record, source)) result[column] = jsonColumns.has(column) ? JSON.stringify(record[source]) : record[source];
      else if (Object.prototype.hasOwnProperty.call(record, column)) result[column] = jsonColumns.has(column) ? JSON.stringify(record[column]) : record[column];
      else result[column] = null;
    }
    return result;
  }

  function fromDbRecord(collection, row) {
    const result = {};
    for (const [key, value] of Object.entries(row)) {
      const jsKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      result[jsKey] = jsonColumns.has(key) && typeof value === "string" ? JSON.parse(value) : value;
    }
    return result;
  }

  async function list(collection) {
    const result = await client.query(`SELECT * FROM ${table(collection)} ORDER BY created_at DESC`);
    return result.rows.map(row => fromDbRecord(collection, row));
  }

  async function append(collection, record) {
    const values = toDbRecord(collection, record);
    const names = Object.keys(values);
    const params = names.map((_, i) => `$${i + 1}`);
    const result = await client.query(`INSERT INTO ${table(collection)} (${names.join(",")}) VALUES (${params.join(",")}) RETURNING *`, names.map(name => values[name]));
    return fromDbRecord(collection, result.rows[0]);
  }

  async function replace(collection, records) {
    const run = async queryClient => {
      await queryClient.query(`DELETE FROM ${table(collection)}`);
      for (const record of records) {
        const values = toDbRecord(collection, record);
        const names = Object.keys(values);
        const params = names.map((_, i) => `$${i + 1}`);
        await queryClient.query(`INSERT INTO ${table(collection)} (${names.join(",")}) VALUES (${params.join(",")})`, names.map(name => values[name]));
      }
      return records;
    };
    if (!transaction) return run(client);
    await client.query("BEGIN");
    try { const result = await run(client); await client.query("COMMIT"); return result; }
    catch (error) { await client.query("ROLLBACK"); throw error; }
  }

  async function update(collection, id, patch) {
    const allowed = columns[collection] || [];
    const entries = Object.entries(patch).filter(([key]) => allowed.includes(key) || allowed.includes(key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`)));
    if (!entries.length) return null;
    const sets = [];
    const params = [id];
    for (const [key, value] of entries) {
      const column = key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
      if (!allowed.includes(column)) continue;
      sets.push(`${column} = $${params.length + 1}`);
      params.push(jsonColumns.has(column) ? JSON.stringify(value) : value);
    }
    if (!sets.length) return null;
    if (allowed.includes("updated_at")) { sets.push(`updated_at = $${params.length + 1}`); params.push(new Date().toISOString()); }
    const result = await client.query(`UPDATE ${table(collection)} SET ${sets.join(", ")} WHERE id = $1 RETURNING *`, params);
    return result.rows[0] ? fromDbRecord(collection, result.rows[0]) : null;
  }

  return assertSqlAdapter({ list, append, replace, update });
}
