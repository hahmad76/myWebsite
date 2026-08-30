// Production SQL adapter contract.
// Application code depends only on these repository operations.

export function assertSqlAdapter(adapter) {
  const required = ["list", "append", "replace", "update"];
  for (const method of required) {
    if (typeof adapter?.[method] !== "function") throw new TypeError(`SQL adapter must implement ${method}()`);
  }
  return adapter;
}

export const SQL_COLLECTION_MAP = Object.freeze({
  serviceRequests: "service_requests",
  teacherInterests: "teacher_interests",
  schoolRequirements: "school_requirements",
  contentSubmissions: "content_submissions",
  submissions: "submissions",
  quotes: "quotes",
  orders: "orders",
  announcements: "announcements",
  resources: "resources",
  notifications: "notifications",
  users: "users",
  sessions: "sessions",
  auditLog: "audit_log"
});
