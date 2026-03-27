import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt } from "./columns";
import { users } from "./users";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const notificationTypeEnum = pgEnum("notification_type", [
  "grading_completed",
  "feedback_received",
  "class_invite",
  "goal_achieved",
  "system",
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const notifications = pgTable(
  "notifications",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum().notNull(),
    title: varchar({ length: 255 }).notNull(),
    body: text(),
    data: jsonb().$type<Record<string, unknown>>(),
    readAt: timestamp("read_at", { withTimezone: true, mode: "string" }),
    createdAt,
  },
  (table) => ({
    userIdx: index("notifications_user_idx").on(table.userId, table.createdAt),
    unreadIdx: index("notifications_unread_idx")
      .on(table.userId)
      .where(sql`${table.readAt} IS NULL`),
  }),
);

export const deviceTokens = pgTable(
  "device_tokens",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text().notNull().unique(),
    platform: varchar({ length: 10 }).notNull(), // 'ios' | 'android' | 'web'
    createdAt,
  },
  (table) => ({
    userIdx: index("device_tokens_user_idx").on(table.userId),
  }),
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type DeviceToken = typeof deviceTokens.$inferSelect;
export type NewDeviceToken = typeof deviceTokens.$inferInsert;
