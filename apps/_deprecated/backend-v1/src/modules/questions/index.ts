import { ROLES } from "@common/auth-types";
import {
  AuthErrors,
  CrudErrors,
  CrudWithConflictErrors,
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
  QuestionWithKnowledgePoints,
} from "./schema";
import { create, find, list, remove, update } from "./service";

export const questions = new Elysia({
  name: "module:questions",
  prefix: "/questions",
  detail: { tags: ["Questions"] },
})
  .use(authPlugin)

  .get("/", ({ query, user }) => list(query, user), {
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
        "Return a paginated list of questions with optional skill, part, and keyword filters.",
      security: [{ bearerAuth: [] }],
    },
  })

  .get("/:id", ({ params }) => find(params.id), {
    auth: true,
    params: IdParam,
    response: {
      200: QuestionWithKnowledgePoints,
      ...CrudErrors,
    },
    detail: {
      summary: "Get question by ID",
      description:
        "Retrieve a single question including its linked knowledge points.",
      security: [{ bearerAuth: [] }],
    },
  })

  .post(
    "/",
    ({ body, user, set }) => {
      set.status = 201;
      return create(user.sub, body);
    },
    {
      role: ROLES.INSTRUCTOR,
      body: QuestionCreateBody,
      response: {
        201: QuestionWithKnowledgePoints,
        400: ErrorResponse,
        ...AuthErrors,
        ...CrudWithConflictErrors,
        422: ErrorResponse,
      },
      detail: {
        summary: "Create question",
        description:
          "Create a new question with content, answer key, and optional knowledge point links. Requires instructor role or above.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .patch("/:id", ({ params, body, user }) => update(params.id, body, user), {
    role: ROLES.INSTRUCTOR,
    params: IdParam,
    body: QuestionUpdateBody,
    response: {
      200: QuestionWithKnowledgePoints,
      400: ErrorResponse,
      ...CrudWithConflictErrors,
      422: ErrorResponse,
    },
    detail: {
      summary: "Update question",
      description:
        "Partially update a question's metadata, content, or knowledge point links. Requires instructor role or above.",
      security: [{ bearerAuth: [] }],
    },
  })

  .delete("/:id", ({ params }) => remove(params.id), {
    role: ROLES.ADMIN,
    params: IdParam,
    response: {
      200: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      ...CrudWithConflictErrors,
    },
    detail: {
      summary: "Delete question",
      description:
        "Delete a question. Fails if referenced by active exams. Requires admin role.",
      security: [{ bearerAuth: [] }],
    },
  });
