import { AuthErrors, IdParam, PaginationMeta } from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import {
  DeviceTokenBody,
  DeviceTokenItem,
  NotificationItem,
  NotificationListQuery,
} from "./schema";
import {
  list,
  markAllRead,
  markRead,
  registerDevice,
  removeDevice,
  unreadCount,
} from "./service";

export const notificationsModule = new Elysia({
  name: "module:notifications",
  prefix: "/notifications",
  detail: { tags: ["Notifications"] },
})
  .use(authPlugin)

  .get("/", ({ query, user }) => list(user.sub, query), {
    auth: true,
    query: NotificationListQuery,
    response: {
      200: t.Object({
        data: t.Array(NotificationItem),
        meta: PaginationMeta,
      }),
      ...AuthErrors,
    },
    detail: {
      summary: "List notifications",
      description:
        "Return paginated notifications for the current user, newest first.",
      security: [{ bearerAuth: [] }],
    },
  })

  .get("/unread-count", ({ user }) => unreadCount(user.sub), {
    auth: true,
    response: {
      200: t.Object({ count: t.Number() }),
      ...AuthErrors,
    },
    detail: {
      summary: "Unread notification count",
      security: [{ bearerAuth: [] }],
    },
  })

  .post("/:id/read", ({ params, user }) => markRead(params.id, user.sub), {
    auth: true,
    params: IdParam,
    response: {
      200: t.Object({ id: t.String({ format: "uuid" }) }),
      ...AuthErrors,
    },
    detail: {
      summary: "Mark notification as read",
      security: [{ bearerAuth: [] }],
    },
  })

  .post("/read-all", ({ user }) => markAllRead(user.sub), {
    auth: true,
    response: {
      200: t.Object({ updated: t.Number() }),
      ...AuthErrors,
    },
    detail: {
      summary: "Mark all notifications as read",
      security: [{ bearerAuth: [] }],
    },
  });

export const devicesModule = new Elysia({
  name: "module:devices",
  prefix: "/devices",
  detail: { tags: ["Notifications"] },
})
  .use(authPlugin)

  .post(
    "/",
    ({ body, user, set }) => {
      set.status = 201;
      return registerDevice(user.sub, body);
    },
    {
      auth: true,
      body: DeviceTokenBody,
      response: {
        201: DeviceTokenItem,
        ...AuthErrors,
      },
      detail: {
        summary: "Register device token",
        description:
          "Register a device token for push notifications. Updates if token already exists.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .delete("/:id", ({ params, user }) => removeDevice(params.id, user.sub), {
    auth: true,
    params: IdParam,
    response: {
      200: t.Object({ id: t.String({ format: "uuid" }) }),
      ...AuthErrors,
    },
    detail: {
      summary: "Remove device token",
      security: [{ bearerAuth: [] }],
    },
  });
