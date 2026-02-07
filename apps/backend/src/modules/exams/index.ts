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
import { authPlugin } from "@/plugins/auth";
import { ExamModel } from "./model";
import { ExamService } from "./service";

export const exams = new Elysia({
  prefix: "/exams",
  detail: { tags: ["Exams"] },
})
  .use(authPlugin)

  .get("/", ({ query }) => ExamService.list(query), {
    auth: true,
    query: t.Object({
      ...PaginationQuery.properties,
      level: t.Optional(QuestionLevel),
      isActive: t.Optional(t.Boolean()),
    }),
    response: {
      200: t.Object({
        data: t.Array(ExamModel.Exam),
        meta: PaginationMeta,
      }),
      ...AuthErrors,
    },
    detail: { summary: "List exams" },
  })

  .get("/:id", ({ params: { id } }) => ExamService.getById(id), {
    auth: true,
    params: IdParam,
    response: { 200: ExamModel.Exam, ...CrudErrors },
    detail: { summary: "Get exam by ID" },
  })

  .post(
    "/",
    async ({ body, user, set }) => {
      set.status = 201;
      return await ExamService.create(user.sub, body);
    },
    {
      role: "admin",
      body: ExamModel.CreateBody,
      response: { 201: ExamModel.Exam, ...AuthErrors },
      detail: { summary: "Create exam (Admin)" },
    },
  )

  .patch("/:id", ({ params: { id }, body }) => ExamService.update(id, body), {
    role: "admin",
    params: IdParam,
    body: ExamModel.UpdateBody,
    response: { 200: ExamModel.Exam, ...CrudErrors },
    detail: { summary: "Update exam (Admin)" },
  })

  .post(
    "/:id/start",
    ({ params: { id }, user }) => ExamService.startSession(user.sub, id),
    {
      auth: true,
      params: IdParam,
      response: { 200: ExamModel.Session, 400: ErrorResponse, ...CrudErrors },
      detail: { summary: "Start exam session" },
    },
  )

  .get(
    "/sessions/:sessionId",
    ({ params: { sessionId }, user }) =>
      ExamService.getSessionById(sessionId, user.sub, user.role === "admin"),
    {
      auth: true,
      params: ExamModel.SessionIdParam,
      response: { 200: ExamModel.Session, ...CrudErrors },
      detail: { summary: "Get session by ID" },
    },
  )

  .put(
    "/sessions/:sessionId",
    ({ params: { sessionId }, body, user }) =>
      ExamService.saveAnswers(sessionId, user.sub, body.answers),
    {
      auth: true,
      params: ExamModel.SessionIdParam,
      body: ExamModel.AnswerSaveBody,
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
      ExamService.submitAnswer(sessionId, user.sub, body),
    {
      auth: true,
      params: ExamModel.SessionIdParam,
      body: t.Object({
        questionId: t.String({ format: "uuid" }),
        answer: t.Any(),
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
    ({ params: { sessionId }, user }) =>
      ExamService.submitExam(sessionId, user.sub),
    {
      auth: true,
      params: ExamModel.SessionIdParam,
      response: { 200: ExamModel.Session, 400: ErrorResponse, ...AuthErrors },
      detail: { summary: "Submit exam for grading" },
    },
  );
