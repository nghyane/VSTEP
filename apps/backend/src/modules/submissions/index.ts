/**
 * Submissions Module Controller
 * Elysia routes for submission management
 */

import {
  ErrorResponse,
  IdParam,
  PaginationMeta,
  PaginationQuery,
} from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { SubmissionService } from "./service";

// ─── Inline enum schemas ────────────────────────────────────────

const SkillType = t.Union([
  t.Literal("listening"),
  t.Literal("reading"),
  t.Literal("writing"),
  t.Literal("speaking"),
]);

const SubmissionStatus = t.Union([
  t.Literal("pending"),
  t.Literal("queued"),
  t.Literal("processing"),
  t.Literal("analyzing"),
  t.Literal("grading"),
  t.Literal("review_required"),
  t.Literal("completed"),
  t.Literal("failed"),
]);

// ─── Inline response schemas ────────────────────────────────────

const SubmissionInfo = t.Object({
  id: t.String({ format: "uuid" }),
  userId: t.String({ format: "uuid" }),
  questionId: t.String({ format: "uuid" }),
  skill: SkillType,
  status: SubmissionStatus,
  score: t.Optional(t.Nullable(t.Number())),
  band: t.Optional(t.Nullable(t.Number())),
  completedAt: t.Optional(t.String()),
  createdAt: t.String(),
  updatedAt: t.String(),
});

const SubmissionWithDetails = t.Object({
  ...SubmissionInfo.properties,
  answer: t.Optional(t.Any()),
  result: t.Optional(t.Any()),
  feedback: t.Optional(t.Nullable(t.String())),
});

// ─── Controller ─────────────────────────────────────────────────

export const submissions = new Elysia({ prefix: "/submissions" })
  .use(authPlugin)

  /**
   * GET /submissions
   * List submissions
   */
  .get(
    "/",
    async ({ query, user, set }) => {
      const result = await SubmissionService.list(
        query,
        user!.sub,
        user!.role === "admin",
      );
      set.status = 200;
      return result;
    },
    {
      auth: true,
      query: t.Object({
        ...PaginationQuery.properties,
        skill: t.Optional(SkillType),
        status: t.Optional(SubmissionStatus),
        userId: t.Optional(t.String({ format: "uuid" })),
      }),
      response: {
        200: t.Object({
          data: t.Array(SubmissionWithDetails),
          meta: PaginationMeta,
        }),
        401: ErrorResponse,
      },
      detail: {
        summary: "List submissions",
        description: "List submissions with filtering and pagination",
        tags: ["Submissions"],
      },
    },
  )

  /**
   * GET /submissions/:id
   * Get submission by ID
   */
  .get(
    "/:id",
    async ({ params, user, set }) => {
      const result = await SubmissionService.getById(
        params.id,
        user!.sub,
        user!.role === "admin",
      );
      set.status = 200;
      return result;
    },
    {
      auth: true,
      params: IdParam,
      response: {
        200: SubmissionWithDetails,
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: "Get submission",
        description: "Get a submission by ID",
        tags: ["Submissions"],
      },
    },
  )

  /**
   * POST /submissions
   * Create new submission
   */
  .post(
    "/",
    async ({ body, user, set }) => {
      const result = await SubmissionService.create(user!.sub, body);
      set.status = 201;
      return result;
    },
    {
      auth: true,
      body: t.Object({
        questionId: t.String({ format: "uuid" }),
        skill: SkillType,
        answer: t.Any(),
      }),
      response: {
        201: SubmissionWithDetails,
        400: ErrorResponse,
        401: ErrorResponse,
        404: ErrorResponse,
        422: ErrorResponse,
      },
      detail: {
        summary: "Create submission",
        description: "Create a new submission",
        tags: ["Submissions"],
      },
    },
  )

  /**
   * PATCH /submissions/:id
   * Update submission
   */
  .patch(
    "/:id",
    async ({ params, body, user, set }) => {
      const result = await SubmissionService.update(
        params.id,
        user!.sub,
        user!.role === "admin",
        body,
      );
      set.status = 200;
      return result;
    },
    {
      auth: true,
      params: IdParam,
      body: t.Partial(
        t.Object({
          answer: t.Any(),
          status: SubmissionStatus,
          score: t.Number(),
          band: t.Number(),
          feedback: t.String(),
        }),
      ),
      response: {
        200: SubmissionWithDetails,
        400: ErrorResponse,
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
        422: ErrorResponse,
      },
      detail: {
        summary: "Update submission",
        description: "Update a submission",
        tags: ["Submissions"],
      },
    },
  )

  /**
   * POST /submissions/:id/grade
   * Grade submission (instructor/admin only)
   */
  .post(
    "/:id/grade",
    async ({ params, body, set }) => {
      const result = await SubmissionService.grade(params.id, body);
      set.status = 200;
      return result;
    },
    {
      role: "instructor",
      params: IdParam,
      body: t.Object({
        score: t.Number(),
        band: t.Optional(t.Number()),
        feedback: t.Optional(t.String()),
      }),
      response: {
        200: SubmissionWithDetails,
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
        422: ErrorResponse,
      },
      detail: {
        summary: "Grade submission",
        description: "Grade a submission (instructor/admin only)",
        tags: ["Submissions"],
      },
    },
  )

  /**
   * POST /submissions/:id/auto-grade
   * Auto-grade submission (admin only)
   */
  .post(
    "/:id/auto-grade",
    async ({ params, set }) => {
      const result = await SubmissionService.autoGrade(params.id);
      set.status = 200;
      return result;
    },
    {
      role: "admin",
      params: IdParam,
      response: {
        200: t.Object({
          score: t.Number(),
          result: t.Any(),
        }),
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: "Auto-grade submission",
        description: "Auto-grade an objective submission (admin only)",
        tags: ["Submissions"],
      },
    },
  )

  /**
   * DELETE /submissions/:id
   * Delete submission
   */
  .delete(
    "/:id",
    async ({ params, user, set }) => {
      const result = await SubmissionService.delete(
        params.id,
        user!.sub,
        user!.role === "admin",
      );
      set.status = 200;
      return result;
    },
    {
      auth: true,
      params: IdParam,
      response: {
        200: t.Object({ id: t.String({ format: "uuid" }) }),
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: "Delete submission",
        description: "Soft delete a submission",
        tags: ["Submissions"],
      },
    },
  );
