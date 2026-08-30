import crypto from "node:crypto";

export function createNotificationService(storage) {
  async function create({ type, title, message, recipient = "admin", entityId = null }) {
    const notification = {
      id: crypto.randomUUID(),
      type,
      title,
      message,
      recipient,
      entityId,
      read: false,
      createdAt: new Date().toISOString()
    };
    await storage.append("notifications", notification);
    return notification;
  }

  return { create };
}
