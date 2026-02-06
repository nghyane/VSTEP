/**
 * Submissions Module Controller
 * Elysia routes for submission management
 */

import { Skill, SubmissionStatus as SubmissionStatusEnum } from "@common/enums";
import {
  ErrorResponse,
  IdParam,
  PaginationMeta,
  PaginationQuery,
} from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { SubmissionService } from "./service";

// ─── Inline response schemas ────────────────────────────────────

const SubmissionInfo = t.Object({
  id: t.String({ format: "uuid" }),
  userId: t.String({ format: "uuid" }),
  questionId: t.String({ format: "uuid" }),
  skill: Skill,
  status: SubmissionStatusEnum,
  score: t.Optional(t.Nullable(t.Number())),
  band: t.Optional(
    t.Nullable(
      t.Union([
        t.Literal("A1"),
        t.Literal("A2"),
        t.Literal("B1"),
        t.Literal("B2"),
        t.Literal("C1"),
      ]),
    ),
  ),
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

export const submissions = new Elysia({
  prefix: "/submissions",
  detail: { tags: ["Submissions"] },
})
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
        skill: t.Optional(Skill),
        status: t.Optional(SubmissionStatusEnum),
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
        skill: Skill,
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
          status: SubmissionStatusEnum,
          score: t.Number(),
          band: t.Union([
            t.Literal("A1"),
            t.Literal("A2"),
            t.Literal("B1"),
            t.Literal("B2"),
            t.Literal("C1"),
          ]),
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
        band: t.Optional(t.String()),
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
      const result = await SubmissionService.remove(
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
      },
    },
  );
