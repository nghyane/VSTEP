import { ROLES } from "@common/auth-types";
import {
  AuthErrors,
  CrudErrors,
  ErrorResponse,
  IdParam,
  PaginationMeta,
} from "@common/schemas";
import { SubmissionAnswer } from "@db/types/answers";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { submitExam } from "./grading";
import {
  Exam,
  ExamAnswerSaveBody,
  ExamCreateBody,
  ExamListQuery,
  ExamSession,
  ExamUpdateBody,
  SessionParams,
} from "./schema";
import { createExam, getExamById, listExams, updateExam } from "./service";
import {
  getExamSessionById,
  saveExamAnswers,
  startExamSession,
  submitExamAnswer,
} from "./session";

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
        data: t.Array(Exam),
        meta: PaginationMeta,
      }),
      ...AuthErrors,
    },
    detail: {
      summary: "List exams",
      description:
        "Return a paginated list of exams with optional level and active-status filters.",
      security: [{ bearerAuth: [] }],
    },
  })

  .get("/:id", ({ params }) => getExamById(params.id), {
    auth: true,
    params: IdParam,
    response: { 200: Exam, ...CrudErrors },
    detail: {
      summary: "Get exam by ID",
      description:
        "Retrieve a single exam including its blueprint and active status.",
      security: [{ bearerAuth: [] }],
    },
  })

  .post(
    "/",
    ({ body, user, set }) => {
      set.status = 201;
      return createExam(user.sub, body);
    },
    {
      role: ROLES.ADMIN,
      body: ExamCreateBody,
      response: { 201: Exam, ...AuthErrors },
      detail: {
        summary: "Create exam",
        description:
          "Create a new exam with a level, question blueprint, and optional active status. Requires admin role.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .patch("/:id", ({ params, body }) => updateExam(params.id, body), {
    role: ROLES.ADMIN,
    params: IdParam,
    body: ExamUpdateBody,
    response: { 200: Exam, ...CrudErrors },
    detail: {
      summary: "Update exam",
      description:
        "Partially update an exam's level, blueprint, or active status. Requires admin role.",
      security: [{ bearerAuth: [] }],
    },
  })

  .post(
    "/:id/start",
    ({ params, user }) => startExamSession(user.sub, params.id),
    {
      auth: true,
      params: IdParam,
      response: { 200: ExamSession, 400: ErrorResponse, ...CrudErrors },
      detail: {
        summary: "Start exam session",
        description:
          "Start a new exam session or resume an existing in-progress session for the given exam.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .get(
    "/sessions/:sessionId",
    ({ params, user }) => getExamSessionById(params.sessionId, user),
    {
      auth: true,
      params: SessionParams,
      response: { 200: ExamSession, ...CrudErrors },
      detail: {
        summary: "Get exam session by ID",
        description:
          "Retrieve an exam session including saved answers. Only the session owner or an admin may access.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .put(
    "/sessions/:sessionId",
    ({ params, body, user }) =>
      saveExamAnswers(params.sessionId, body.answers, user),
    {
      auth: true,
      params: SessionParams,
      body: ExamAnswerSaveBody,
      response: {
        200: t.Object({ success: t.Boolean(), saved: t.Number() }),
        400: ErrorResponse,
        ...AuthErrors,
      },
      detail: {
        summary: "Auto-save session answers",
        description:
          "Bulk upsert answers for an in-progress exam session. Intended for periodic client-side auto-save.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .post(
    "/sessions/:sessionId/answer",
    ({ params, body, user }) => submitExamAnswer(params.sessionId, body, user),
    {
      auth: true,
      params: SessionParams,
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
        summary: "Submit single answer",
        description:
          "Submit or update an answer for a specific question within an in-progress exam session.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .post(
    "/sessions/:sessionId/submit",
    ({ params, user }) => submitExam(params.sessionId, user),
    {
      auth: true,
      params: SessionParams,
      response: { 200: ExamSession, 400: ErrorResponse, ...AuthErrors },
      detail: {
        summary: "Submit exam for grading",
        description:
          "Finalize the exam session. Listening/reading answers are auto-graded; writing/speaking answers create pending submissions for manual review.",
        security: [{ bearerAuth: [] }],
      },
    },
  );
