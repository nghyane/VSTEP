import { ROLES } from "@common/auth-types";
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
  Question,
  QuestionCreateBody,
  QuestionListQuery,
  QuestionUpdateBody,
  QuestionVersion,
  QuestionVersionBody,
} from "./schema";
import {
  createQuestion,
  getQuestionById,
  listQuestions,
  removeQuestion,
  restoreQuestion,
  updateQuestion,
} from "./service";
import {
  createQuestionVersion,
  getQuestionVersion,
  getQuestionVersions,
} from "./version-service";

export const questions = new Elysia({
  name: "module:questions",
  prefix: "/questions",
  detail: { tags: ["Questions"] },
})
  .use(authPlugin)

  .get("/", ({ query, user }) => listQuestions(query, user), {
    auth: true,
    query: QuestionListQuery,
    response: {
      200: t.Object({
        data: t.Array(Question),
        meta: PaginationMeta,
      }),
      400: ErrorResponse,
      ...AuthErrors,
    },
    detail: {
      summary: "List questions",
      description:
        "Return a paginated list of questions with optional skill, level, and keyword filters.",
      security: [{ bearerAuth: [] }],
    },
  })

  .get("/:id", ({ params }) => getQuestionById(params.id), {
    auth: true,
    params: IdParam,
    response: {
      200: Question,
      ...CrudErrors,
    },
    detail: {
      summary: "Get question by ID",
      description:
        "Retrieve a single question including its latest version content.",
      security: [{ bearerAuth: [] }],
    },
  })

  .post(
    "/",
    ({ body, user, set }) => {
      set.status = 201;
      return createQuestion(user.sub, body);
    },
    {
      role: ROLES.INSTRUCTOR,
      body: QuestionCreateBody,
      response: {
        201: Question,
        400: ErrorResponse,
        ...AuthErrors,
        422: ErrorResponse,
      },
      detail: {
        summary: "Create question",
        description:
          "Create a new question with content and metadata. Requires instructor role or above.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .patch(
    "/:id",
    ({ params, body, user }) => updateQuestion(params.id, body, user),
    {
      role: ROLES.INSTRUCTOR,
      params: IdParam,
      body: QuestionUpdateBody,
      response: {
        200: Question,
        400: ErrorResponse,
        ...CrudErrors,
        422: ErrorResponse,
      },
      detail: {
        summary: "Update question",
        description:
          "Partially update a question's metadata or content. Requires instructor role or above.",
        security: [{ bearerAuth: [] }],
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
      role: ROLES.INSTRUCTOR,
      params: IdParam,
      body: QuestionVersionBody,
      response: {
        201: QuestionVersion,
        400: ErrorResponse,
        ...CrudErrors,
        422: ErrorResponse,
      },
      detail: {
        summary: "Create question version",
        description:
          "Publish a new immutable version snapshot of the question's content. Requires instructor role or above.",
        tags: ["Versions"],
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .get("/:id/versions", ({ params }) => getQuestionVersions(params.id), {
    role: ROLES.INSTRUCTOR,
    params: IdParam,
    response: {
      200: t.Object({
        data: t.Array(QuestionVersion),
        meta: t.Object({ total: t.Number() }),
      }),
      ...CrudErrors,
    },
    detail: {
      summary: "List question versions",
      description:
        "Return all version snapshots for a question, ordered by creation date. Requires instructor role or above.",
      tags: ["Versions"],
      security: [{ bearerAuth: [] }],
    },
  })

  .get(
    "/:id/versions/:versionId",
    ({ params }) => getQuestionVersion(params.id, params.versionId),
    {
      role: ROLES.INSTRUCTOR,
      params: t.Object({
        id: t.String({ format: "uuid" }),
        versionId: t.String({ format: "uuid" }),
      }),
      response: {
        200: QuestionVersion,
        ...CrudErrors,
      },
      detail: {
        summary: "Get question version by ID",
        description:
          "Retrieve a specific version snapshot of a question. Requires instructor role or above.",
        tags: ["Versions"],
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .delete("/:id", ({ params }) => removeQuestion(params.id), {
    role: ROLES.ADMIN,
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
      description:
        "Soft-delete a question. The record is retained but excluded from queries. Requires admin role.",
      security: [{ bearerAuth: [] }],
    },
  })

  .post("/:id/restore", ({ params }) => restoreQuestion(params.id), {
    role: ROLES.ADMIN,
    params: IdParam,
    response: {
      200: Question,
      400: ErrorResponse,
      ...CrudErrors,
    },
    detail: {
      summary: "Restore question",
      description:
        "Restore a previously soft-deleted question back to active status. Requires admin role.",
      tags: ["Admin"],
      security: [{ bearerAuth: [] }],
    },
  });
