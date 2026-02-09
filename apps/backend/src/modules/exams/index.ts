import { SubmissionAnswer } from "@common/answer-schemas";
import {
  AuthErrors,
  CrudErrors,
  ErrorResponse,
  IdParam,
  PaginationMeta,
} from "@common/schemas";
import { ExamSchema, ExamSessionSchema } from "@db/typebox";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { submitExam } from "./grading-service";
import {
  ExamAnswerSaveBody,
  ExamCreateBody,
  ExamListQuery,
  ExamSessionIdParam,
  ExamUpdateBody,
} from "./model";
import { createExam, getExamById, listExams, updateExam } from "./service";
import {
  getExamSessionById,
  saveExamAnswers,
  startExamSession,
  submitExamAnswer,
} from "./session-service";

export const exams = new Elysia({
  name: "module:exams",
  prefix: "/exams",
  detail: { tags: ["Exams"] },
})
  .use(authPlugin)

  .get("/", ({ query }) => listExams(query), {
    auth: true,
    query: ExamListQuery,
    response: {
      200: t.Object({
        data: t.Array(ExamSchema),
        meta: PaginationMeta,
      }),
      ...AuthErrors,
    },
    detail: {
      summary: "List exams",
      description:
        "Retrieve a paginated list of exams, optionally filtered by level and active status.",
    },
  })

  .get("/:id", ({ params }) => getExamById(params.id), {
    auth: true,
    params: IdParam,
    response: { 200: ExamSchema, ...CrudErrors },
    detail: {
      summary: "Get exam by ID",
      description: "Retrieve a single exam by its unique identifier.",
    },
  })

  .post(
    "/",
    ({ body, user, set }) => {
      set.status = 201;
      return createExam(user.sub, body);
    },
    {
      role: "admin",
      body: ExamCreateBody,
      response: { 201: ExamSchema, ...AuthErrors },
      detail: {
        summary: "Create exam (Admin)",
        description:
          "Create a new exam with a level, blueprint, and optional active status. Requires admin role.",
      },
    },
  )

  .patch("/:id", ({ params, body }) => updateExam(params.id, body), {
    role: "admin",
    params: IdParam,
    body: ExamUpdateBody,
    response: { 200: ExamSchema, ...CrudErrors },
    detail: {
      summary: "Update exam (Admin)",
      description:
        "Partially update an existing exam's level, blueprint, or active status. Requires admin role.",
    },
  })

  .post(
    "/:id/start",
    ({ params, user }) => startExamSession(user.sub, params.id),
    {
      auth: true,
      params: IdParam,
      response: { 200: ExamSessionSchema, 400: ErrorResponse, ...CrudErrors },
      detail: {
        summary: "Start exam session",
        description:
          "Start a new exam session or return an existing in-progress session for the given exam.",
      },
    },
  )

  .get(
    "/sessions/:sessionId",
    ({ params, user }) => getExamSessionById(params.sessionId, user),
    {
      auth: true,
      params: ExamSessionIdParam,
      response: { 200: ExamSessionSchema, ...CrudErrors },
      detail: {
        summary: "Get session by ID",
        description:
          "Retrieve an exam session by its unique identifier. Only the session owner or an admin can access it.",
      },
    },
  )

  .put(
    "/sessions/:sessionId",
    ({ params, body, user }) =>
      saveExamAnswers(params.sessionId, body.answers, user),
    {
      auth: true,
      params: ExamSessionIdParam,
      body: ExamAnswerSaveBody,
      response: {
        200: t.Object({ success: t.Boolean(), saved: t.Number() }),
        400: ErrorResponse,
        ...AuthErrors,
      },
      detail: {
        summary: "Auto-save answers for session",
        description:
          "Bulk upsert answers for an in-progress exam session. Used for periodic auto-save.",
      },
    },
  )

  .post(
    "/sessions/:sessionId/answer",
    ({ params, body, user }) => submitExamAnswer(params.sessionId, body, user),
    {
      auth: true,
      params: ExamSessionIdParam,
      body: t.Object({
        questionId: t.String({ format: "uuid" }),
        answer: SubmissionAnswer,
      }),
      response: {
        200: t.Object({ success: t.Boolean() }),
        400: ErrorResponse,
        ...AuthErrors,
      },
      detail: {
        summary: "Submit single answer for session",
        description:
          "Submit or update a single answer for a specific question within an in-progress exam session.",
      },
    },
  )

  .post(
    "/sessions/:sessionId/submit",
    ({ params, user }) => submitExam(params.sessionId, user),
    {
      auth: true,
      params: ExamSessionIdParam,
      response: { 200: ExamSessionSchema, 400: ErrorResponse, ...AuthErrors },
      detail: {
        summary: "Submit exam for grading",
        description:
          "Finalize an exam session: auto-grade listening/reading answers and create pending submissions for writing/speaking.",
      },
    },
  );
