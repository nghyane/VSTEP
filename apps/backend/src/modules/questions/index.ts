import { QuestionLevel, QuestionSkill } from "@common/enums";
import {
  ErrorResponse,
  IdParam,
  PaginationMeta,
  PaginationQuery,
} from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin, verifyAccessToken } from "@/plugins/auth";
import { QuestionService } from "./service";

const QuestionInfo = t.Object({
  id: t.String({ format: "uuid" }),
  skill: QuestionSkill,
  level: QuestionLevel,
  format: t.String(),
  content: t.Any(),
  answerKey: t.Optional(t.Any()),
  version: t.Number(),
  isActive: t.Boolean(),
  createdBy: t.Optional(t.Nullable(t.String({ format: "uuid" }))),
  createdAt: t.String(),
  updatedAt: t.String(),
});

const QuestionWithDetails = t.Object({
  ...QuestionInfo.properties,
  deletedAt: t.Optional(t.Nullable(t.String())),
});

const QuestionVersionInfo = t.Object({
  id: t.String({ format: "uuid" }),
  questionId: t.String({ format: "uuid" }),
  version: t.Number(),
  content: t.Any(),
  answerKey: t.Optional(t.Any()),
  createdAt: t.String(),
});

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
          data: t.Array(QuestionWithDetails),
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
        200: QuestionWithDetails,
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
      body: t.Object({
        skill: QuestionSkill,
        level: QuestionLevel,
        format: t.String(),
        content: t.Any(),
        answerKey: t.Optional(t.Any()),
      }),
      response: {
        201: QuestionInfo,
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
      body: t.Partial(
        t.Object({
          skill: QuestionSkill,
          level: QuestionLevel,
          format: t.String(),
          content: t.Any(),
          answerKey: t.Optional(t.Any()),
          isActive: t.Boolean(),
        }),
      ),
      response: {
        200: QuestionWithDetails,
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
      body: t.Object({
        content: t.Any(),
        answerKey: t.Optional(t.Any()),
      }),
      response: {
        201: QuestionVersionInfo,
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
          data: t.Array(QuestionVersionInfo),
          meta: t.Object({
            total: t.Number(),
          }),
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
        200: QuestionVersionInfo,
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
        200: QuestionWithDetails,
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
