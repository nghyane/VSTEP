import { ROLES } from "@common/auth-types";
import {
  AuthErrors,
  CrudErrors,
  ErrorResponse,
  IdParam,
  PaginationMeta,
} from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import {
  Class,
  ClassDetail,
  ClassListQuery,
  CreateClassBody,
  CreateFeedbackBody,
  Feedback,
  FeedbackListQuery,
  JoinClassBody,
  UpdateClassBody,
} from "./schema";
import {
  createClass,
  createFeedback,
  getClassById,
  getDashboard,
  getMemberProgress,
  joinClass,
  leaveClass,
  listClasses,
  listFeedback,
  removeClass,
  removeMember,
  rotateInviteCode,
  updateClass,
} from "./service";

export const classesModule = new Elysia({
  name: "module:classes",
  prefix: "/classes",
  detail: { tags: ["Classes"] },
})
  .use(authPlugin)

  // ── Class CRUD ───────────────────────────────────────────

  .post("/", ({ body, user }) => createClass(body, user), {
    role: ROLES.INSTRUCTOR,
    body: CreateClassBody,
    response: { 200: Class, ...AuthErrors },
    detail: { summary: "Create class", security: [{ bearerAuth: [] }] },
  })

  .get("/", ({ query, user }) => listClasses(query, user), {
    auth: true,
    query: ClassListQuery,
    response: {
      200: t.Object({ data: t.Array(Class), meta: PaginationMeta }),
      ...AuthErrors,
    },
    detail: { summary: "List my classes", security: [{ bearerAuth: [] }] },
  })

  .get("/:id", ({ params, user }) => getClassById(params.id, user), {
    auth: true,
    params: IdParam,
    response: { 200: ClassDetail, ...CrudErrors },
    detail: {
      summary: "Get class detail with members",
      security: [{ bearerAuth: [] }],
    },
  })

  .patch(
    "/:id",
    ({ params, body, user }) => updateClass(params.id, body, user),
    {
      role: ROLES.INSTRUCTOR,
      params: IdParam,
      body: UpdateClassBody,
      response: { 200: Class, ...CrudErrors },
      detail: {
        summary: "Update class",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .delete("/:id", ({ params, user }) => removeClass(params.id, user), {
    role: ROLES.INSTRUCTOR,
    params: IdParam,
    response: {
      200: t.Object({
        id: t.String({ format: "uuid" }),
        deletedAt: t.String({ format: "date-time" }),
      }),
      ...CrudErrors,
    },
    detail: { summary: "Delete class", security: [{ bearerAuth: [] }] },
  })

  // ── Invite code ──────────────────────────────────────────

  .post(
    "/:id/rotate-code",
    ({ params, user }) => rotateInviteCode(params.id, user),
    {
      role: ROLES.INSTRUCTOR,
      params: IdParam,
      response: { 200: Class, ...CrudErrors },
      detail: {
        summary: "Rotate invite code",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  // ── Join / Leave ─────────────────────────────────────────

  .post("/join", ({ body, user }) => joinClass(body, user), {
    auth: true,
    body: JoinClassBody,
    response: {
      200: t.Object({
        classId: t.String({ format: "uuid" }),
        className: t.String(),
      }),
      ...AuthErrors,
      409: ErrorResponse,
    },
    detail: {
      summary: "Join class by invite code",
      security: [{ bearerAuth: [] }],
    },
  })

  .post("/:id/leave", ({ params, user }) => leaveClass(params.id, user), {
    auth: true,
    params: IdParam,
    response: {
      200: t.Object({
        id: t.String({ format: "uuid" }),
        removedAt: t.String({ format: "date-time" }),
      }),
      ...CrudErrors,
    },
    detail: { summary: "Leave class", security: [{ bearerAuth: [] }] },
  })

  // ── Member management ────────────────────────────────────

  .delete(
    "/:id/members/:userId",
    ({ params, user }) => removeMember(params.id, params.userId, user),
    {
      role: ROLES.INSTRUCTOR,
      params: t.Object({
        id: t.String({ format: "uuid" }),
        userId: t.String({ format: "uuid" }),
      }),
      response: {
        200: t.Object({
          id: t.String({ format: "uuid" }),
          removedAt: t.String({ format: "date-time" }),
        }),
        ...CrudErrors,
      },
      detail: {
        summary: "Remove member from class",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  // ── Dashboard ────────────────────────────────────────────

  .get("/:id/dashboard", ({ params, user }) => getDashboard(params.id, user), {
    role: ROLES.INSTRUCTOR,
    params: IdParam,
    response: { 200: t.Any(), ...CrudErrors },
    detail: {
      summary: "Class dashboard overview",
      security: [{ bearerAuth: [] }],
    },
  })

  .get(
    "/:id/members/:userId/progress",
    ({ params, user }) => getMemberProgress(params.id, params.userId, user),
    {
      role: ROLES.INSTRUCTOR,
      params: t.Object({
        id: t.String({ format: "uuid" }),
        userId: t.String({ format: "uuid" }),
      }),
      response: { 200: t.Any(), ...CrudErrors },
      detail: {
        summary: "View member progress",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  // ── Feedback ─────────────────────────────────────────────

  .post(
    "/:id/feedback",
    ({ params, body, user }) => createFeedback(params.id, body, user),
    {
      role: ROLES.INSTRUCTOR,
      params: IdParam,
      body: CreateFeedbackBody,
      response: { 200: Feedback, ...CrudErrors },
      detail: {
        summary: "Send feedback to learner",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .get(
    "/:id/feedback",
    ({ params, query, user }) => listFeedback(params.id, query, user),
    {
      auth: true,
      params: IdParam,
      query: FeedbackListQuery,
      response: {
        200: t.Object({ data: t.Array(Feedback), meta: PaginationMeta }),
        ...AuthErrors,
      },
      detail: {
        summary: "List feedback",
        security: [{ bearerAuth: [] }],
      },
    },
  );
