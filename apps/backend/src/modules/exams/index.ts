import { QuestionLevel } from "@common/enums";
import { ErrorResponse, IdParam, PaginationMeta, PaginationQuery } from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { ExamModel } from "./model";
import { ExamService } from "./service";

export const exams = new Elysia({
  prefix: "/exams",
  detail: { tags: ["Exams"] },
})
  .use(authPlugin)

  .get(
    "/",
    async ({ query }) => {
      return await ExamService.list(query);
    },
    {
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
        401: ErrorResponse,
      },
      detail: {
        summary: "List exams",
      },
    },
  )

  .get(
    "/:id",
    async ({ params: { id } }) => {
      return await ExamService.getById(id);
    },
    {
      auth: true,
      params: IdParam,
      response: {
        200: ExamModel.Exam,
        401: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: "Get exam by ID",
      },
    },
  )

  .post(
    "/",
    async ({ body, user, set }) => {
      set.status = 201;
      return await ExamService.create(user.sub, body);
    },
    {
      role: "admin",
      body: ExamModel.CreateBody,
      response: {
        201: ExamModel.Exam,
        401: ErrorResponse,
        403: ErrorResponse,
      },
      detail: {
        summary: "Create exam (Admin)",
      },
    },
  )

  .patch(
    "/:id",
    async ({ params: { id }, body }) => {
      return await ExamService.update(id, body);
    },
    {
      role: "admin",
      params: IdParam,
      body: ExamModel.UpdateBody,
      response: {
        200: ExamModel.Exam,
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: "Update exam (Admin)",
      },
    },
  )

  .post(
    "/:id/start",
    async ({ params: { id }, user }) => {
      return await ExamService.startSession(user.sub, id);
    },
    {
      auth: true,
      params: IdParam,
      response: {
        200: ExamModel.Session,
        400: ErrorResponse,
        401: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: "Start exam session",
      },
    },
  )

  .get(
    "/sessions/:sessionId",
    async ({ params: { sessionId }, user }) => {
      return await ExamService.getSessionById(
        sessionId,
        user.sub,
        user.role === "admin",
      );
    },
    {
      auth: true,
      params: ExamModel.SessionIdParam,
      response: {
        200: ExamModel.Session,
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: "Get session by ID",
      },
    },
  )

  .put(
    "/sessions/:sessionId",
    async ({ params: { sessionId }, body, user }) => {
      return await ExamService.saveAnswers(
        sessionId,
        user.sub,
        body.answers,
      );
    },
    {
      auth: true,
      params: ExamModel.SessionIdParam,
      body: ExamModel.AnswerSaveBody,
      response: {
        200: t.Object({ success: t.Boolean(), saved: t.Number() }),
        400: ErrorResponse,
        401: ErrorResponse,
        403: ErrorResponse,
      },
      detail: {
        summary: "Auto-save answers for session",
      },
    },
  )

  .post(
    "/sessions/:sessionId/answer",
    async ({ params: { sessionId }, body, user }) => {
      return await ExamService.submitAnswer(sessionId, user.sub, body);
    },
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
        401: ErrorResponse,
        403: ErrorResponse,
      },
      detail: {
        summary: "Submit single answer for session",
      },
    },
  )

  .post(
    "/sessions/:sessionId/submit",
    async ({ params: { sessionId }, user }) => {
      return await ExamService.submitExam(sessionId, user.sub);
    },
    {
      auth: true,
      params: ExamModel.SessionIdParam,
      response: {
        200: ExamModel.Session,
        400: ErrorResponse,
        401: ErrorResponse,
        403: ErrorResponse,
      },
      detail: {
        summary: "Submit exam for grading",
      },
    },
  );
