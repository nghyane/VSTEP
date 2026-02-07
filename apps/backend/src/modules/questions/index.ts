import { QuestionLevel, Skill } from "@common/enums";
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
    ({ query, user }) => QuestionService.list(query, user.role === "admin"),
    {
      auth: true,
      query: t.Object({
        ...PaginationQuery.properties,
        skill: t.Optional(Skill),
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
        ...AuthErrors,
      },
      detail: {
        summary: "List questions",
        description: "List questions with filtering and pagination",
      },
    },
  )

  .get("/:id", ({ params }) => QuestionService.getById(params.id), {
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
  })

  .post(
    "/",
    async ({ body, user, set }) => {
      set.status = 201;
      return QuestionService.create(user.sub, body);
    },
    {
      role: "instructor",
      body: QuestionModel.CreateBody,
      response: {
        201: QuestionModel.Question,
        ...AuthErrors,
      },
      detail: {
        summary: "Create question",
        description: "Create a new question",
      },
    },
  )

  .patch(
    "/:id",
    ({ params, body, user }) =>
      QuestionService.update(params.id, user.sub, user.role === "admin", body),
    {
      role: "instructor",
      params: IdParam,
      body: QuestionModel.UpdateBody,
      response: {
        200: QuestionModel.QuestionWithDetails,
        ...CrudErrors,
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
      return QuestionService.createVersion(
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
        ...CrudErrors,
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
    ({ params }) => QuestionService.getVersions(params.id),
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
    ({ params }) => QuestionService.getVersion(params.id, params.versionId),
    {
      role: "instructor",
      params: t.Object({
        id: t.String({ format: "uuid" }),
        versionId: t.String({ format: "uuid" }),
      }),
      response: {
        200: QuestionModel.Version,
        ...CrudErrors,
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
    ({ params, user }) =>
      QuestionService.remove(params.id, user.sub, user.role === "admin"),
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
    ({ params }) => QuestionService.restore(params.id, true),
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
