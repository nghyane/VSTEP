import { db, paginate, takeFirst, takeFirstOrThrow } from "@db/index";
import {
  deviceTokens,
  type NewNotification,
  notifications,
} from "@db/schema/notifications";
import { and, desc, eq, isNull } from "drizzle-orm";
import type { DeviceTokenBody, NotificationListQuery } from "./schema";

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function list(userId: string, query: NotificationListQuery) {
  const where = and(
    eq(notifications.userId, userId),
    query.unreadOnly ? isNull(notifications.readAt) : undefined,
  );

  return paginate(
    db
      .select()
      .from(notifications)
      .where(where)
      .orderBy(desc(notifications.createdAt))
      .$dynamic(),
    db.$count(notifications, where),
    query,
  );
}

export async function unreadCount(userId: string) {
  const count = await db.$count(
    notifications,
    and(eq(notifications.userId, userId), isNull(notifications.readAt)),
  );
  return { count };
}

export async function markRead(id: string, userId: string) {
  const result = await db
    .update(notifications)
    .set({ readAt: new Date().toISOString() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .returning({ id: notifications.id })
    .then(takeFirst);

  if (!result) {
    throw new Error("Notification not found");
  }

  return result;
}

export async function markAllRead(userId: string) {
  const rows = await db
    .update(notifications)
    .set({ readAt: new Date().toISOString() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .returning({ id: notifications.id });

  return { updated: rows.length };
}

/**
 * Create a notification for a user.
 * Called internally by other modules (not exposed as API).
 */
export async function createNotification(data: NewNotification) {
  return db
    .insert(notifications)
    .values(data)
    .returning()
    .then(takeFirstOrThrow);
}

// ---------------------------------------------------------------------------
// Device Tokens
// ---------------------------------------------------------------------------

export async function registerDevice(userId: string, body: DeviceTokenBody) {
  return db
    .insert(deviceTokens)
    .values({ userId, token: body.token, platform: body.platform })
    .onConflictDoUpdate({
      target: deviceTokens.token,
      set: { userId, platform: body.platform },
    })
    .returning()
    .then(takeFirstOrThrow);
}

export async function removeDevice(id: string, userId: string) {
  const result = await db
    .delete(deviceTokens)
    .where(and(eq(deviceTokens.id, id), eq(deviceTokens.userId, userId)))
    .returning({ id: deviceTokens.id })
    .then(takeFirst);

  if (!result) {
    throw new Error("Device token not found");
  }

  return result;
}
