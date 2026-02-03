/**
 * Questions Module Controller
 * Elysia routes for question management
 * Pattern: Elysia instance with direct service calls
 * @see https://elysiajs.com/pattern/mvc.html
 */

import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { errorPlugin } from "@/plugins/error";
import { QuestionModel } from "./model";
import { QuestionService } from "./service";

/**
 * Questions controller with all question routes
 * Mounted at /questions
 * Direct service calls - no .decorate() needed for static methods
 */
export const questions = new Elysia({ prefix: "/questions" })
  .use(errorPlugin)
  .use(authPlugin)

  // ============ Public Routes ============

  /**
   * GET /questions
   * List questions (public - but shows only active for non-authenticated)
   */
  .get(
    "/",
    async ({ query, userId, isAdmin, set }) => {
      const result = await QuestionService.list(
        query,
        userId ?? "anonymous",
        isAdmin,
      );
      set.status = 200;
      return result;
    },
    {
      query: QuestionModel.listQuestionsQuery,
      response: {
        200: QuestionModel.listQuestionsResponse,
        400: QuestionModel.questionError,
      },
      detail: {
        summary: "List questions",
        description: "List questions with filtering and pagination",
        tags: ["Questions"],
      },
    },
  )

  /**
   * GET /questions/:id
   * Get question by ID
   */
  .get(
    "/:id",
    async ({ params, set }) => {
      const result = await QuestionService.getById(params.id);
      set.status = 200;
      return result;
    },
    {
      params: QuestionModel.questionIdParam,
      response: {
        200: QuestionModel.questionResponse,
        404: QuestionModel.questionError,
      },
      detail: {
        summary: "Get question",
        description: "Get a question by ID",
        tags: ["Questions"],
      },
    },
  )

  // ============ Protected Routes ============

  /**
   * POST /questions
   * Create new question
   */
  .post(
    "/",
    async ({ body, userId, set }) => {
      const result = await QuestionService.create(userId!, body);
      set.status = 201;
      return result;
    },
    {
      auth: true,
      body: QuestionModel.createQuestionBody,
      response: {
        201: QuestionModel.createQuestionResponse,
        400: QuestionModel.questionError,
        401: QuestionModel.questionError,
        422: QuestionModel.questionError,
      },
      detail: {
        summary: "Create question",
        description: "Create a new question",
        tags: ["Questions"],
      },
    },
  )

  /**
   * PATCH /questions/:id
   * Update question
   */
  .patch(
    "/:id",
    async ({ params, body, userId, isAdmin, set }) => {
      const result = await QuestionService.update(
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
      params: QuestionModel.questionIdParam,
      body: QuestionModel.updateQuestionBody,
      response: {
        200: QuestionModel.updateQuestionResponse,
        400: QuestionModel.questionError,
        401: QuestionModel.questionError,
        403: QuestionModel.questionError,
        404: QuestionModel.questionError,
        422: QuestionModel.questionError,
      },
      detail: {
        summary: "Update question",
        description: "Update a question",
        tags: ["Questions"],
      },
    },
  )

  /**
   * POST /questions/:id/versions
   * Create a new version of a question
   */
  .post(
    "/:id/versions",
    async ({ params, body, userId, isAdmin, set }) => {
      const result = await QuestionService.createVersion(
        params.id,
        userId!,
        isAdmin,
        body,
      );
      set.status = 201;
      return result;
    },
    {
      auth: true,
      params: QuestionModel.questionIdParam,
      body: QuestionModel.createVersionBody,
      response: {
        201: QuestionModel.createVersionResponse,
        400: QuestionModel.questionError,
        401: QuestionModel.questionError,
        403: QuestionModel.questionError,
        404: QuestionModel.questionError,
        422: QuestionModel.questionError,
      },
      detail: {
        summary: "Create question version",
        description: "Create a new version of a question",
        tags: ["Questions", "Versions"],
      },
    },
  )

  /**
   * GET /questions/:id/versions
   * Get all versions of a question
   */
  .get(
    "/:id/versions",
    async ({ params, set }) => {
      const result = await QuestionService.getVersions(params.id);
      set.status = 200;
      return result;
    },
    {
      params: QuestionModel.questionIdParam,
      response: {
        200: QuestionModel.listQuestionVersionsResponse,
        404: QuestionModel.questionError,
      },
      detail: {
        summary: "List question versions",
        description: "Get all versions of a question",
        tags: ["Questions", "Versions"],
      },
    },
  )

  /**
   * GET /questions/:id/versions/:versionId
   * Get a specific version of a question
   */
  .get(
    "/:id/versions/:versionId",
    async ({ params, set }) => {
      const result = await QuestionService.getVersion(
        params.id,
        params.versionId,
      );
      set.status = 200;
      return result;
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
        versionId: t.String({ format: "uuid" }),
      }),
      response: {
        200: QuestionModel.questionVersionResponse,
        404: QuestionModel.questionError,
      },
      detail: {
        summary: "Get question version",
        description: "Get a specific version of a question",
        tags: ["Questions", "Versions"],
      },
    },
  )

  /**
   * DELETE /questions/:id
   * Delete question (soft delete)
   */
  .delete(
    "/:id",
    async ({ params, userId, isAdmin, set }) => {
      const result = await QuestionService.delete(params.id, userId!, isAdmin);
      set.status = 200;
      return result;
    },
    {
      auth: true,
      params: QuestionModel.questionIdParam,
      response: {
        200: QuestionModel.deleteQuestionResponse,
        401: QuestionModel.questionError,
        403: QuestionModel.questionError,
        404: QuestionModel.questionError,
      },
      detail: {
        summary: "Delete question",
        description: "Soft delete a question",
        tags: ["Questions"],
      },
    },
  )

  /**
   * POST /questions/:id/restore
   * Restore a deleted question (admin only)
   */
  .post(
    "/:id/restore",
    async ({ params, userId, isAdmin, set }) => {
      const result = await QuestionService.restore(params.id, userId!, isAdmin);
      set.status = 200;
      return result;
    },
    {
      admin: true,
      params: QuestionModel.questionIdParam,
      response: {
        200: QuestionModel.updateQuestionResponse,
        400: QuestionModel.questionError,
        401: QuestionModel.questionError,
        403: QuestionModel.questionError,
        404: QuestionModel.questionError,
      },
      detail: {
        summary: "Restore question",
        description: "Restore a deleted question (admin only)",
        tags: ["Questions", "Admin"],
      },
    },
  );
