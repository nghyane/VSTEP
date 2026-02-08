import { QuestionLevel } from "@common/enums";
import {
  AuthErrors,
  CrudErrors,
  ErrorResponse,
  IdParam,
  PaginationMeta,
  PaginationQuery,
} from "@common/schemas";
import { Elysia, t } from "elysia";
import { SubmissionAnswer } from "@/modules/questions/content-schemas";
import { authPlugin } from "@/plugins/auth";
import {
  ExamAnswerSaveBody,
  ExamCreateBody,
  ExamSchema,
  ExamSessionIdParam,
  ExamSessionSchema,
  ExamUpdateBody,
} from "./model";
import {
  createExam,
  getExamById,
  getExamSessionById,
  listExams,
  saveExamAnswers,
  startExamSession,
  submitExam,
  submitExamAnswer,
  updateExam,
} from "./service";

export const exams = new Elysia({
  prefix: "/exams",
  detail: { tags: ["Exams"] },
})
  .use(authPlugin)

  .get("/", ({ query }) => listExams(query), {
    auth: true,
    query: t.Object({
      ...PaginationQuery.properties,
      level: t.Optional(QuestionLevel),
      isActive: t.Optional(t.Boolean()),
    }),
    response: {
      200: t.Object({
        data: t.Array(ExamSchema),
        meta: PaginationMeta,
      }),
      ...AuthErrors,
    },
    detail: { summary: "List exams" },
  })

  .get("/:id", ({ params: { id } }) => getExamById(id), {
    auth: true,
    params: IdParam,
    response: { 200: ExamSchema, ...CrudErrors },
    detail: { summary: "Get exam by ID" },
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
      detail: { summary: "Create exam (Admin)" },
    },
  )

  .patch("/:id", ({ params: { id }, body }) => updateExam(id, body), {
    role: "admin",
    params: IdParam,
    body: ExamUpdateBody,
    response: { 200: ExamSchema, ...CrudErrors },
    detail: { summary: "Update exam (Admin)" },
  })

  .post(
    "/:id/start",
    ({ params: { id }, user }) => startExamSession(user.sub, id),
    {
      auth: true,
      params: IdParam,
      response: { 200: ExamSessionSchema, 400: ErrorResponse, ...CrudErrors },
      detail: { summary: "Start exam session" },
    },
  )

  .get(
    "/sessions/:sessionId",
    ({ params: { sessionId }, user }) => getExamSessionById(sessionId, user),
    {
      auth: true,
      params: ExamSessionIdParam,
      response: { 200: ExamSessionSchema, ...CrudErrors },
      detail: { summary: "Get session by ID" },
    },
  )

  .put(
    "/sessions/:sessionId",
    ({ params: { sessionId }, body, user }) =>
      saveExamAnswers(sessionId, user, body.answers),
    {
      auth: true,
      params: ExamSessionIdParam,
      body: ExamAnswerSaveBody,
      response: {
        200: t.Object({ success: t.Boolean(), saved: t.Number() }),
        400: ErrorResponse,
        ...AuthErrors,
      },
      detail: { summary: "Auto-save answers for session" },
    },
  )

  .post(
    "/sessions/:sessionId/answer",
    ({ params: { sessionId }, body, user }) =>
      submitExamAnswer(sessionId, user, body),
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
      detail: { summary: "Submit single answer for session" },
    },
  )

  .post(
    "/sessions/:sessionId/submit",
    ({ params: { sessionId }, user }) => submitExam(sessionId, user),
    {
      auth: true,
      params: ExamSessionIdParam,
      response: { 200: ExamSessionSchema, 400: ErrorResponse, ...AuthErrors },
      detail: { summary: "Submit exam for grading" },
    },
  );
