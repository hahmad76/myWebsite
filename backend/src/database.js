const COLLECTIONS = {
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
  auditLog: "audit_log"
};

export function createDatabaseAdapter(storage) {
  return {
    collections: COLLECTIONS,
    list: collection => storage.list(collection),
    append: (collection, record) => storage.append(collection, record),
    async update(collection, id, patch) {
      const rows = await storage.list(collection);
      const index = rows.findIndex(row => row.id === id);
      if (index < 0) return null;
      rows[index] = { ...rows[index], ...patch, updatedAt: new Date().toISOString() };
      await storage.replace(collection, rows);
      return rows[index];
    }
  };
}
