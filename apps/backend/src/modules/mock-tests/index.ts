/**
 * Mock Tests Module Controller
 * Routes for mock test management
 */

import {
  ErrorResponse,
  IdParam,
  PaginationMeta,
  PaginationQuery,
} from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { MockTestService } from "./service";

// ─── Inline Schemas ──────────────────────────────────────────────

const MockTestLevel = t.Union([
  t.Literal("A2"),
  t.Literal("B1"),
  t.Literal("B2"),
  t.Literal("C1"),
]);

const MockTestStatus = t.Union([
  t.Literal("in_progress"),
  t.Literal("completed"),
  t.Literal("abandoned"),
]);

const MockTestSchema = t.Object({
  id: t.String({ format: "uuid" }),
  level: MockTestLevel,
  blueprint: t.Any(),
  isActive: t.Boolean(),
  createdBy: t.Nullable(t.String({ format: "uuid" })),
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
});

const MockTestSessionSchema = t.Object({
  id: t.String({ format: "uuid" }),
  userId: t.String({ format: "uuid" }),
  mockTestId: t.String({ format: "uuid" }),
  status: MockTestStatus,
  listeningScore: t.Nullable(t.Number()),
  readingScore: t.Nullable(t.Number()),
  writingScore: t.Nullable(t.Number()),
  speakingScore: t.Nullable(t.Number()),
  overallExamScore: t.Nullable(t.Number()),
  sectionScores: t.Nullable(t.Any()),
  startedAt: t.String({ format: "date-time" }),
  completedAt: t.Nullable(t.String({ format: "date-time" })),
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
});

const SessionIdParam = t.Object({
  sessionId: t.String({ format: "uuid" }),
});

// ─── Controller ──────────────────────────────────────────────────

export const mockTests = new Elysia({ prefix: "/mock-tests" })
  .use(authPlugin)

  // ============ Public Routes ============

  .get(
    "/",
    async ({ query }) => {
      return await MockTestService.list(query);
    },
    {
      query: t.Object({
        ...PaginationQuery.properties,
        level: t.Optional(MockTestLevel),
        isActive: t.Optional(t.Boolean()),
      }),
      response: {
        200: t.Object({
          data: t.Array(MockTestSchema),
          meta: PaginationMeta,
        }),
      },
      detail: {
        summary: "List mock tests",
        tags: ["Mock Tests"],
      },
    },
  )

  .get(
    "/:id",
    async ({ params: { id } }) => {
      return await MockTestService.getById(id);
    },
    {
      params: IdParam,
      response: {
        200: MockTestSchema,
        404: ErrorResponse,
      },
      detail: {
        summary: "Get mock test by ID",
        tags: ["Mock Tests"],
      },
    },
  )

  // ============ Admin Routes ============

  .post(
    "/",
    async ({ body, user }) => {
      return await MockTestService.create(user!.sub, body);
    },
    {
      role: "admin",
      body: t.Object({
        level: MockTestLevel,
        blueprint: t.Any(),
        isActive: t.Optional(t.Boolean({ default: true })),
      }),
      response: {
        200: MockTestSchema,
        401: ErrorResponse,
        403: ErrorResponse,
      },
      detail: {
        summary: "Create mock test (Admin)",
        tags: ["Mock Tests"],
      },
    },
  )

  .patch(
    "/:id",
    async ({ params: { id }, body }) => {
      return await MockTestService.update(id, body);
    },
    {
      role: "admin",
      params: IdParam,
      body: t.Partial(
        t.Object({
          level: MockTestLevel,
          blueprint: t.Any(),
          isActive: t.Boolean(),
        }),
      ),
      response: {
        200: MockTestSchema,
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: "Update mock test (Admin)",
        tags: ["Mock Tests"],
      },
    },
  )

  // ============ Session Routes (Auth Required) ============

  .post(
    "/sessions",
    async ({ body, user }) => {
      return await MockTestService.startSession(user!.sub, body);
    },
    {
      auth: true,
      body: t.Object({
        mockTestId: t.String({ format: "uuid" }),
      }),
      response: {
        200: MockTestSessionSchema,
        400: ErrorResponse,
        401: ErrorResponse,
      },
      detail: {
        summary: "Start mock test session",
        tags: ["Mock Tests"],
      },
    },
  )

  .get(
    "/sessions/:sessionId",
    async ({ params: { sessionId }, user }) => {
      return await MockTestService.getSessionById(
        sessionId,
        user!.sub,
        user!.role === "admin",
      );
    },
    {
      auth: true,
      params: SessionIdParam,
      response: {
        200: MockTestSessionSchema,
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: "Get session by ID",
        tags: ["Mock Tests"],
      },
    },
  )

  .post(
    "/sessions/:sessionId/submit",
    async ({ params: { sessionId }, body, user }) => {
      return await MockTestService.submitAnswer(sessionId, user!.sub, body);
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
        tags: ["Mock Tests"],
      },
    },
  )

  .post(
    "/sessions/:sessionId/complete",
    async ({ params: { sessionId }, user }) => {
      return await MockTestService.completeSession(sessionId, user!.sub);
    },
    {
      auth: true,
      params: SessionIdParam,
      response: {
        200: MockTestSessionSchema,
        400: ErrorResponse,
        401: ErrorResponse,
        403: ErrorResponse,
      },
      detail: {
        summary: "Complete mock test session",
        tags: ["Mock Tests"],
      },
    },
  );
