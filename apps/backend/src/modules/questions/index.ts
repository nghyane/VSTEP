import { QuestionLevel, QuestionSkill } from "@common/enums";
import { ErrorResponse, IdParam, PaginationMeta, PaginationQuery } from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin, verifyAccessToken } from "@/plugins/auth";
import { QuestionModel } from "./model";
import { QuestionService } from "./service";

export const questions = new Elysia({
  prefix: "/questions",
  detail: { tags: ["Questions"] },
})
  .use(authPlugin)

  .get(
    "/",
    async ({ query, bearer: token, set }) => {
      let userId = "anonymous";
      let isAdmin = false;
      if (token) {
        try {
          const user = await verifyAccessToken(token);
          userId = user.sub;
          isAdmin = user.role === "admin";
        } catch {
          // Invalid/expired token on public route → treat as anonymous
        }
      }
      const result = await QuestionService.list(query, userId, isAdmin);
      set.status = 200;
      return result;
    },
    {
      query: t.Object({
        ...PaginationQuery.properties,
        skill: t.Optional(QuestionSkill),
        level: t.Optional(QuestionLevel),
        format: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
        search: t.Optional(t.String()),
      }),
      response: {
        200: t.Object({
          data: t.Array(QuestionModel.QuestionWithDetails),
          meta: PaginationMeta,
        }),
        400: ErrorResponse,
      },
      detail: {
        summary: "List questions",
        description: "List questions with filtering and pagination",
      },
    },
  )

  .get(
    "/:id",
    async ({ params, set }) => {
      const result = await QuestionService.getById(params.id);
      set.status = 200;
      return result;
    },
    {
      params: IdParam,
      response: {
        200: QuestionModel.QuestionWithDetails,
        404: ErrorResponse,
      },
      detail: {
        summary: "Get question",
        description: "Get a question by ID",
      },
    },
  )

  .post(
    "/",
    async ({ body, user, set }) => {
      const result = await QuestionService.create(user.sub, body);
      set.status = 201;
      return result;
    },
    {
      auth: true,
      body: QuestionModel.CreateBody,
      response: {
        201: QuestionModel.Question,
        400: ErrorResponse,
        401: ErrorResponse,
        422: ErrorResponse,
      },
      detail: {
        summary: "Create question",
        description: "Create a new question",
      },
    },
  )

  .patch(
    "/:id",
    async ({ params, body, user, set }) => {
      const result = await QuestionService.update(
        params.id,
        user.sub,
        user.role === "admin",
        body,
      );
      set.status = 200;
      return result;
    },
    {
      auth: true,
      params: IdParam,
      body: QuestionModel.UpdateBody,
      response: {
        200: QuestionModel.QuestionWithDetails,
        400: ErrorResponse,
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
        422: ErrorResponse,
      },
      detail: {
        summary: "Update question",
        description: "Update a question",
      },
    },
  )

  .post(
    "/:id/versions",
    async ({ params, body, user, set }) => {
      const result = await QuestionService.createVersion(
        params.id,
        user.sub,
        user.role === "admin",
        body,
      );
      set.status = 201;
      return result;
    },
    {
      auth: true,
      params: IdParam,
      body: QuestionModel.VersionBody,
      response: {
        201: QuestionModel.Version,
        400: ErrorResponse,
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
        422: ErrorResponse,
      },
      detail: {
        summary: "Create question version",
        description: "Create a new version of a question",
        tags: ["Versions"],
      },
    },
  )

  .get(
    "/:id/versions",
    async ({ params, set }) => {
      const result = await QuestionService.getVersions(params.id);
      set.status = 200;
      return result;
    },
    {
      params: IdParam,
      response: {
        200: t.Object({
          data: t.Array(QuestionModel.Version),
          meta: t.Object({ total: t.Number() }),
        }),
        404: ErrorResponse,
      },
      detail: {
        summary: "List question versions",
        description: "Get all versions of a question",
        tags: ["Versions"],
      },
    },
  )

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
        200: QuestionModel.Version,
        404: ErrorResponse,
      },
      detail: {
        summary: "Get question version",
        description: "Get a specific version of a question",
        tags: ["Versions"],
      },
    },
  )

  .delete(
    "/:id",
    async ({ params, user, set }) => {
      const result = await QuestionService.remove(
        params.id,
        user.sub,
        user.role === "admin",
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
        summary: "Delete question",
        description: "Soft delete a question",
      },
    },
  )

  .post(
    "/:id/restore",
    async ({ params, user, set }) => {
      const result = await QuestionService.restore(
        params.id,
        user.sub,
        user.role === "admin",
      );
      set.status = 200;
      return result;
    },
    {
      role: "admin",
      params: IdParam,
      response: {
        200: QuestionModel.QuestionWithDetails,
        400: ErrorResponse,
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: "Restore question",
        description: "Restore a deleted question (admin only)",
        tags: ["Admin"],
      },
    },
  );
