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
import { dashboard, memberProgress } from "./dashboard";
import * as feedback from "./feedback";
import * as members from "./members";
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
  create,
  find,
  list,
  remove,
  rotateInviteCode,
  update,
} from "./service";

export const classes = new Elysia({
  name: "module:classes",
  prefix: "/classes",
  detail: { tags: ["Classes"] },
})
  .use(authPlugin)

  .post("/", ({ body, user }) => create(body, user), {
    role: ROLES.INSTRUCTOR,
    body: CreateClassBody,
    response: { 200: Class, ...AuthErrors },
    detail: { summary: "Create class", security: [{ bearerAuth: [] }] },
  })

  .get("/", ({ query, user }) => list(query, user), {
    auth: true,
    query: ClassListQuery,
    response: {
      200: t.Object({ data: t.Array(Class), meta: PaginationMeta }),
      ...AuthErrors,
    },
    detail: { summary: "List my classes", security: [{ bearerAuth: [] }] },
  })

  .get("/:id", ({ params, user }) => find(params.id, user), {
    auth: true,
    params: IdParam,
    response: { 200: ClassDetail, ...CrudErrors },
    detail: {
      summary: "Get class detail with members",
      security: [{ bearerAuth: [] }],
    },
  })

  .patch("/:id", ({ params, body, user }) => update(params.id, body, user), {
    role: ROLES.INSTRUCTOR,
    params: IdParam,
    body: UpdateClassBody,
    response: { 200: Class, ...CrudErrors },
    detail: {
      summary: "Update class",
      security: [{ bearerAuth: [] }],
    },
  })

  .delete("/:id", ({ params, user }) => remove(params.id, user), {
    role: ROLES.INSTRUCTOR,
    params: IdParam,
    response: {
      200: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      ...CrudErrors,
    },
    detail: { summary: "Delete class", security: [{ bearerAuth: [] }] },
  })

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

  .post("/join", ({ body, user }) => members.join(body, user), {
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

  .post("/:id/leave", ({ params, user }) => members.leave(params.id, user), {
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

  .delete(
    "/:id/members/:userId",
    ({ params, user }) => members.remove(params.id, params.userId, user),
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

  .get("/:id/dashboard", ({ params, user }) => dashboard(params.id, user), {
    role: ROLES.INSTRUCTOR,
    params: IdParam,
    response: {
      200: t.Object({
        memberCount: t.Number(),
        atRiskCount: t.Number(),
        atRiskLearners: t.Array(
          t.Object({
            userId: t.String(),
            fullName: t.Nullable(t.String()),
            email: t.String(),
            reasons: t.Array(t.String()),
          }),
        ),
        skillSummary: t.Record(
          t.String(),
          t.Object({
            avgScore: t.Nullable(t.Number()),
            trendDistribution: t.Object({
              improving: t.Number(),
              stable: t.Number(),
              declining: t.Number(),
            }),
          }),
        ),
      }),
      ...CrudErrors,
    },
    detail: {
      summary: "Class dashboard overview",
      security: [{ bearerAuth: [] }],
    },
  })

  .get(
    "/:id/members/:userId/progress",
    ({ params, user }) => memberProgress(params.id, params.userId, user),
    {
      role: ROLES.INSTRUCTOR,
      params: t.Object({
        id: t.String({ format: "uuid" }),
        userId: t.String({ format: "uuid" }),
      }),
      response: { 200: t.Unknown(), ...CrudErrors },
      detail: {
        summary: "View member progress",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .post(
    "/:id/feedback",
    ({ params, body, user }) => feedback.create(params.id, body, user),
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
    ({ params, query, user }) => feedback.list(params.id, query, user),
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
