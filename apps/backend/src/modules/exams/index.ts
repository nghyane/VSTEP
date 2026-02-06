/**
 * Exams Module Controller
 * Routes for exam management
 */

import {
  ErrorResponse,
  IdParam,
  PaginationMeta,
  PaginationQuery,
} from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { ExamService } from "./service";

// ─── Inline Schemas ──────────────────────────────────────────────

const ExamLevel = t.Union([
  t.Literal("A2"),
  t.Literal("B1"),
  t.Literal("B2"),
  t.Literal("C1"),
]);

const ExamStatus = t.Union([
  t.Literal("in_progress"),
  t.Literal("completed"),
  t.Literal("abandoned"),
]);

const ExamSchema = t.Object({
  id: t.String({ format: "uuid" }),
  level: ExamLevel,
  blueprint: t.Any(),
  isActive: t.Boolean(),
  createdBy: t.Nullable(t.String({ format: "uuid" })),
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
});

const ExamSessionSchema = t.Object({
  id: t.String({ format: "uuid" }),
  userId: t.String({ format: "uuid" }),
  examId: t.String({ format: "uuid" }),
  status: ExamStatus,
  listeningScore: t.Nullable(t.Number()),
  readingScore: t.Nullable(t.Number()),
  writingScore: t.Nullable(t.Number()),
  speakingScore: t.Nullable(t.Number()),
  overallScore: t.Nullable(t.Number()),
  skillScores: t.Nullable(t.Any()),
  startedAt: t.String({ format: "date-time" }),
  completedAt: t.Nullable(t.String({ format: "date-time" })),
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
});

const SessionIdParam = t.Object({
  sessionId: t.String({ format: "uuid" }),
});

// ─── Controller ──────────────────────────────────────────────────

export const exams = new Elysia({ prefix: "/exams" })
  .use(authPlugin)

  // ============ Public Routes ============

  .get(
    "/",
    async ({ query }) => {
      return await ExamService.list(query);
    },
    {
      query: t.Object({
        ...PaginationQuery.properties,
        level: t.Optional(ExamLevel),
        isActive: t.Optional(t.Boolean()),
      }),
      response: {
        200: t.Object({
          data: t.Array(ExamSchema),
          meta: PaginationMeta,
        }),
      },
      detail: {
        summary: "List exams",
        tags: ["Exams"],
      },
    },
  )

  .get(
    "/:id",
    async ({ params: { id } }) => {
      return await ExamService.getById(id);
    },
    {
      params: IdParam,
      response: {
        200: ExamSchema,
        404: ErrorResponse,
      },
      detail: {
        summary: "Get exam by ID",
        tags: ["Exams"],
      },
    },
  )

  // ============ Admin Routes ============

  .post(
    "/",
    async ({ body, user }) => {
      return await ExamService.create(user!.sub, body);
    },
    {
      role: "admin",
      body: t.Object({
        level: ExamLevel,
        blueprint: t.Any(),
        isActive: t.Optional(t.Boolean({ default: true })),
      }),
      response: {
        200: ExamSchema,
        401: ErrorResponse,
        403: ErrorResponse,
      },
      detail: {
        summary: "Create exam (Admin)",
        tags: ["Exams"],
      },
    },
  )

  .patch(
    "/:id",
    async ({ params: { id }, body }) => {
      return await ExamService.update(id, body);
    },
    {
      role: "admin",
      params: IdParam,
      body: t.Partial(
        t.Object({
          level: ExamLevel,
          blueprint: t.Any(),
          isActive: t.Boolean(),
        }),
      ),
      response: {
        200: ExamSchema,
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: "Update exam (Admin)",
        tags: ["Exams"],
      },
    },
  )

  // ============ Session Routes (Auth Required) ============

  .post(
    "/sessions",
    async ({ body, user }) => {
      return await ExamService.startSession(user!.sub, body);
    },
    {
      auth: true,
      body: t.Object({
        examId: t.String({ format: "uuid" }),
      }),
      response: {
        200: ExamSessionSchema,
        400: ErrorResponse,
        401: ErrorResponse,
      },
      detail: {
        summary: "Start exam session",
        tags: ["Exams"],
      },
    },
  )

  .get(
    "/sessions/:sessionId",
    async ({ params: { sessionId }, user }) => {
      return await ExamService.getSessionById(
        sessionId,
        user!.sub,
        user!.role === "admin",
      );
    },
    {
      auth: true,
      params: SessionIdParam,
      response: {
        200: ExamSessionSchema,
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: "Get session by ID",
        tags: ["Exams"],
      },
    },
  )

  .post(
    "/sessions/:sessionId/submit",
    async ({ params: { sessionId }, body, user }) => {
      return await ExamService.submitAnswer(sessionId, user!.sub, body);
    },
    {
      auth: true,
      params: SessionIdParam,
      body: t.Object({
        questionId: t.String({ format: "uuid" }),
        answer: t.Any(),
      }),
      response: {
        200: t.Object({ success: t.Boolean() }),
        400: ErrorResponse,
        401: ErrorResponse,
        403: ErrorResponse,
      },
      detail: {
        summary: "Submit answer for session",
        tags: ["Exams"],
      },
    },
  )

  .post(
    "/sessions/:sessionId/complete",
    async ({ params: { sessionId }, user }) => {
      return await ExamService.completeSession(sessionId, user!.sub);
    },
    {
      auth: true,
      params: SessionIdParam,
      response: {
        200: ExamSessionSchema,
        400: ErrorResponse,
        401: ErrorResponse,
        403: ErrorResponse,
      },
      detail: {
        summary: "Complete exam session",
        tags: ["Exams"],
      },
    },
  );
