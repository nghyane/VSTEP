import { notificationTypeEnum } from "@db/schema/notifications";
import { t } from "elysia";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

const NotificationType = t.UnionEnum(notificationTypeEnum.enumValues);

// ---------------------------------------------------------------------------
// Response schemas
// ---------------------------------------------------------------------------

export const NotificationItem = t.Object({
  id: t.String({ format: "uuid" }),
  type: NotificationType,
  title: t.String(),
  body: t.Nullable(t.String()),
  data: t.Nullable(t.Unknown()),
  readAt: t.Nullable(t.String()),
  createdAt: t.String(),
});

// ---------------------------------------------------------------------------
// Request schemas
// ---------------------------------------------------------------------------

export const NotificationListQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  unreadOnly: t.Optional(t.Boolean({ default: false })),
});
export type NotificationListQuery = typeof NotificationListQuery.static;

export const DeviceTokenBody = t.Object({
  token: t.String({ minLength: 1 }),
  platform: t.UnionEnum(["ios", "android", "web"]),
});
export type DeviceTokenBody = typeof DeviceTokenBody.static;

export const DeviceTokenItem = t.Object({
  id: t.String({ format: "uuid" }),
  token: t.String(),
  platform: t.String(),
  createdAt: t.String(),
});
