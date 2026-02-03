/**
 * Submissions Module Controller
 * Elysia routes for submission management
 * Pattern: Elysia instance with direct service calls
 * @see https://elysiajs.com/pattern/mvc.html
 */

import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { errorPlugin } from "@/plugins/error";
import { SubmissionModel } from "./model";
import { SubmissionService } from "./service";

/**
 * Submissions controller with all submission routes
 * Mounted at /submissions
 * Direct service calls - no .decorate() needed for static methods
 */
export const submissions = new Elysia({ prefix: "/submissions" })
  .use(errorPlugin)
  .use(authPlugin)

  // ============ Protected Routes ============

  /**
   * GET /submissions
   * List submissions
   */
  .get(
    "/",
    async ({ query, userId, isAdmin, set }) => {
      // userId and isAdmin are injected by authPlugin derive
      const result = await SubmissionService.list(query, userId!, isAdmin);
      set.status = 200;
      return result;
    },
    {
      auth: true,
      query: SubmissionModel.listSubmissionsQuery,
      response: {
        200: SubmissionModel.listSubmissionsResponse,
        401: SubmissionModel.submissionError,
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
    async ({ params, userId, isAdmin, set }) => {
      const result = await SubmissionService.getById(
        params.id,
        userId!,
        isAdmin,
      );
      set.status = 200;
      return result;
    },
    {
      auth: true,
      params: SubmissionModel.submissionIdParam,
      response: {
        200: SubmissionModel.submissionResponse,
        401: SubmissionModel.submissionError,
        403: SubmissionModel.submissionError,
        404: SubmissionModel.submissionError,
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
    async ({ body, userId, set }) => {
      const result = await SubmissionService.create(userId!, body);
      set.status = 201;
      return result;
    },
    {
      auth: true,
      body: SubmissionModel.createSubmissionBody,
      response: {
        201: SubmissionModel.createSubmissionResponse,
        400: SubmissionModel.submissionError,
        401: SubmissionModel.submissionError,
        404: SubmissionModel.submissionError,
        422: SubmissionModel.submissionError,
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
    async ({ params, body, userId, isAdmin, set }) => {
      const result = await SubmissionService.update(
        params.id,
        userId!,
        isAdmin,
        body,
      );
      set.status = 200;
      return result;
    },
    {
      auth: true,
      params: SubmissionModel.submissionIdParam,
      body: SubmissionModel.updateSubmissionBody,
      response: {
        200: SubmissionModel.updateSubmissionResponse,
        400: SubmissionModel.submissionError,
        401: SubmissionModel.submissionError,
        403: SubmissionModel.submissionError,
        404: SubmissionModel.submissionError,
        422: SubmissionModel.submissionError,
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
   * Grade submission (admin/instructor only)
   */
  .post(
    "/:id/grade",
    async ({ params, body, set }) => {
      const result = await SubmissionService.grade(params.id, body);
      set.status = 200;
      return result;
    },
    {
      admin: true,
      params: SubmissionModel.submissionIdParam,
      body: SubmissionModel.gradeSubmissionBody,
      response: {
        200: SubmissionModel.gradeSubmissionResponse,
        401: SubmissionModel.submissionError,
        403: SubmissionModel.submissionError,
        404: SubmissionModel.submissionError,
        422: SubmissionModel.submissionError,
      },
      detail: {
        summary: "Grade submission",
        description: "Grade a submission (admin/instructor only)",
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
      admin: true,
      params: SubmissionModel.submissionIdParam,
      response: {
        200: t.Object({
          score: t.Number(),
          result: t.Any(),
        }),
        401: SubmissionModel.submissionError,
        403: SubmissionModel.submissionError,
        404: SubmissionModel.submissionError,
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
    async ({ params, userId, isAdmin, set }) => {
      const result = await SubmissionService.delete(
        params.id,
        userId!,
        isAdmin,
      );
      set.status = 200;
      return result;
    },
    {
      auth: true,
      params: SubmissionModel.submissionIdParam,
      response: {
        200: SubmissionModel.deleteSubmissionResponse,
        401: SubmissionModel.submissionError,
        403: SubmissionModel.submissionError,
        404: SubmissionModel.submissionError,
      },
      detail: {
        summary: "Delete submission",
        description: "Soft delete a submission",
        tags: ["Submissions"],
      },
    },
  );
