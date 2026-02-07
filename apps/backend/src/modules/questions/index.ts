import { QuestionLevel, QuestionSkill } from "@common/enums";
import {
  AuthErrors,
  CrudErrors,
  ErrorResponse,
  IdParam,
  PaginationMeta,
  PaginationQuery,
} from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { QuestionModel } from "./model";
import { QuestionService } from "./service";

export const questions = new Elysia({
  prefix: "/questions",
  detail: { tags: ["Questions"] },
})
  .use(authPlugin)

  .get(
    "/",
    async ({ query, user }) => {
      return await QuestionService.list(query, user.sub, user.role === "admin");
    },
    {
      auth: true,
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
          data: t.Array(QuestionModel.Question),
          meta: PaginationMeta,
        }),
        400: ErrorResponse,
        ...AuthErrors,
      },
      detail: {
        summary: "List questions",
        description: "List questions with filtering and pagination",
      },
    },
  )

  .get(
    "/:id",
    async ({ params }) => {
      return await QuestionService.getById(params.id);
    },
    {
      auth: true,
      params: IdParam,
      response: {
        200: QuestionModel.Question,
        ...CrudErrors,
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
      set.status = 201;
      return await QuestionService.create(user.sub, body);
    },
    {
      role: "instructor",
      body: QuestionModel.CreateBody,
      response: {
        201: QuestionModel.Question,
        400: ErrorResponse,
        ...AuthErrors,
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
    async ({ params, body, user }) => {
      return await QuestionService.update(
        params.id,
        user.sub,
        user.role === "admin",
        body,
      );
    },
    {
      role: "instructor",
      params: IdParam,
      body: QuestionModel.UpdateBody,
      response: {
        200: QuestionModel.QuestionWithDetails,
        400: ErrorResponse,
        ...CrudErrors,
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
      set.status = 201;
      return await QuestionService.createVersion(
        params.id,
        user.sub,
        user.role === "admin",
        body,
      );
    },
    {
      role: "instructor",
      params: IdParam,
      body: QuestionModel.VersionBody,
      response: {
        201: QuestionModel.Version,
        400: ErrorResponse,
        ...CrudErrors,
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
    async ({ params }) => {
      return await QuestionService.getVersions(params.id);
    },
    {
      role: "instructor",
      params: IdParam,
      response: {
        200: t.Object({
          data: t.Array(QuestionModel.Version),
          meta: t.Object({ total: t.Number() }),
        }),
        ...CrudErrors,
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
    async ({ params }) => {
      return await QuestionService.getVersion(params.id, params.versionId);
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
    async ({ params, user }) => {
      return await QuestionService.remove(
        params.id,
        user.sub,
        user.role === "admin",
      );
    },
    {
      role: "admin",
      params: IdParam,
      response: {
        200: t.Object({ id: t.String({ format: "uuid" }) }),
        ...CrudErrors,
      },
      detail: {
        summary: "Delete question",
        description: "Soft delete a question",
      },
    },
  )

  .post(
    "/:id/restore",
    async ({ params, user }) => {
      return await QuestionService.restore(
        params.id,
        user.sub,
        user.role === "admin",
      );
    },
    {
      role: "admin",
      params: IdParam,
      response: {
        200: QuestionModel.QuestionWithDetails,
        400: ErrorResponse,
        ...CrudErrors,
      },
      detail: {
        summary: "Restore question",
        description: "Restore a deleted question (admin only)",
        tags: ["Admin"],
      },
    },
  );
