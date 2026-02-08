import {
  AuthErrors,
  CrudErrors,
  ErrorResponse,
  IdParam,
  PaginationMeta,
} from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import {
  QuestionCreateBody,
  QuestionListQuery,
  QuestionSchema,
  QuestionUpdateBody,
  QuestionVersionBody,
  QuestionVersionSchema,
  QuestionWithDetailsSchema,
} from "./model";
import {
  createQuestion,
  createQuestionVersion,
  getQuestionById,
  getQuestionVersion,
  getQuestionVersions,
  listQuestions,
  removeQuestion,
  restoreQuestion,
  updateQuestion,
} from "./service";

export const questions = new Elysia({
  prefix: "/questions",
  detail: { tags: ["Questions"] },
})
  .use(authPlugin)

  .get("/", ({ query, user }) => listQuestions(query, user), {
    auth: true,
    query: QuestionListQuery,
    response: {
      200: t.Object({
        data: t.Array(QuestionSchema),
        meta: PaginationMeta,
      }),
      400: ErrorResponse,
      ...AuthErrors,
    },
    detail: {
      summary: "List questions",
      description: "List questions with filtering and pagination",
    },
  })

  .get("/:id", ({ params }) => getQuestionById(params.id), {
    auth: true,
    params: IdParam,
    response: {
      200: QuestionSchema,
      ...CrudErrors,
    },
    detail: {
      summary: "Get question",
      description: "Get a question by ID",
    },
  })

  .post(
    "/",
    ({ body, user, set }) => {
      set.status = 201;
      return createQuestion(user.sub, body);
    },
    {
      role: "instructor",
      body: QuestionCreateBody,
      response: {
        201: QuestionSchema,
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
    ({ params, body, user }) => updateQuestion(params.id, body, user),
    {
      role: "instructor",
      params: IdParam,
      body: QuestionUpdateBody,
      response: {
        200: QuestionWithDetailsSchema,
        400: ErrorResponse,
        ...CrudErrors,
        422: ErrorResponse,
      },
      detail: {
        summary: "Update question",
        description: "Update a question by ID",
      },
    },
  )

  .post(
    "/:id/versions",
    ({ params, body, user, set }) => {
      set.status = 201;
      return createQuestionVersion(params.id, body, user);
    },
    {
      role: "instructor",
      params: IdParam,
      body: QuestionVersionBody,
      response: {
        201: QuestionVersionSchema,
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

  .get("/:id/versions", ({ params }) => getQuestionVersions(params.id), {
    role: "instructor",
    params: IdParam,
    response: {
      200: t.Object({
        data: t.Array(QuestionVersionSchema),
        meta: t.Object({ total: t.Number() }),
      }),
      ...CrudErrors,
    },
    detail: {
      summary: "List question versions",
      description: "Get all versions of a question",
      tags: ["Versions"],
    },
  })

  .get(
    "/:id/versions/:versionId",
    ({ params }) => getQuestionVersion(params.id, params.versionId),
    {
      role: "instructor",
      params: t.Object({
        id: t.String({ format: "uuid" }),
        versionId: t.String({ format: "uuid" }),
      }),
      response: {
        200: QuestionVersionSchema,
        ...CrudErrors,
      },
      detail: {
        summary: "Get question version",
        description: "Get a specific version of a question",
        tags: ["Versions"],
      },
    },
  )

  .delete("/:id", ({ params, user }) => removeQuestion(params.id, user), {
    role: "admin",
    params: IdParam,
    response: {
      200: t.Object({
        id: t.String({ format: "uuid" }),
        deletedAt: t.String({ format: "date-time" }),
      }),
      ...CrudErrors,
    },
    detail: {
      summary: "Delete question",
      description: "Soft delete a question",
    },
  })

  .post("/:id/restore", ({ params }) => restoreQuestion(params.id), {
    role: "admin",
    params: IdParam,
    response: {
      200: QuestionWithDetailsSchema,
      400: ErrorResponse,
      ...CrudErrors,
    },
    detail: {
      summary: "Restore question",
      description: "Restore a deleted question (admin only)",
      tags: ["Admin"],
    },
  });
