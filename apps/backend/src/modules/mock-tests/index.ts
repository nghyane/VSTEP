import { Elysia } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { MockTestModel } from "./model";
import { MockTestService } from "./service";

/**
 * Mock Tests Module Controller
 * Routes for mock test management
 */
export const mockTests = new Elysia({ prefix: "/mock-tests" })
  .use(authPlugin)
  .get(
    "/",
    async ({ query }) => {
      return await MockTestService.list(query);
    },
    {
      query: MockTestModel.listMockTestsQuery,
      response: MockTestModel.listMockTestsResponse,
      detail: {
        summary: "List mock tests",
        tags: ["Mock Tests"],
      },
    },
  )
  .get(
    "/:id",
    async ({ params: { id } }) => {
      return await MockTestService.getById(id);
    },
    {
      params: MockTestModel.mockTestIdParam,
      response: MockTestModel.mockTest,
      detail: {
        summary: "Get mock test by ID",
        tags: ["Mock Tests"],
      },
    },
  )
  .post(
    "/",
    async ({ body, user }) => {
      return await MockTestService.create(user!.sub, body);
    },
    {
      body: MockTestModel.createMockTestBody,
      response: MockTestModel.mockTest,
      isUserAdmin: true,
      detail: {
        summary: "Create mock test (Admin)",
        tags: ["Mock Tests"],
      },
    },
  )
  .patch(
    "/:id",
    async ({ params: { id }, body }) => {
      return await MockTestService.update(id, body);
    },
    {
      params: MockTestModel.mockTestIdParam,
      body: MockTestModel.updateMockTestBody,
      response: MockTestModel.mockTest,
      isUserAdmin: true,
      detail: {
        summary: "Update mock test (Admin)",
        tags: ["Mock Tests"],
      },
    },
  )
  .post(
    "/sessions",
    async ({ body, user }) => {
      return await MockTestService.startSession(user!.sub, body);
    },
    {
      body: MockTestModel.createSessionBody,
      response: MockTestModel.mockTestSession,
      detail: {
        summary: "Start mock test session",
        tags: ["Mock Tests"],
      },
    },
  )
  .get(
    "/sessions/:sessionId",
    async ({ params: { sessionId }, user, isAdmin }) => {
      return await MockTestService.getSessionById(
        sessionId,
        user!.sub,
        isAdmin,
      );
    },
    {
      params: MockTestModel.sessionIdParam,
      response: MockTestModel.mockTestSession,
      detail: {
        summary: "Get session by ID",
        tags: ["Mock Tests"],
      },
    },
  )
  .post(
    "/sessions/:sessionId/submit",
    async ({ params: { sessionId }, body, user }) => {
      return await MockTestService.submitAnswer(sessionId, user!.sub, body);
    },
    {
      params: MockTestModel.sessionIdParam,
      body: MockTestModel.submitAnswerBody,
      detail: {
        summary: "Submit answer for session",
        tags: ["Mock Tests"],
      },
    },
  )
  .post(
    "/sessions/:sessionId/complete",
    async ({ params: { sessionId }, user }) => {
      return await MockTestService.completeSession(sessionId, user!.sub);
    },
    {
      params: MockTestModel.sessionIdParam,
      response: MockTestModel.mockTestSession,
      detail: {
        summary: "Complete mock test session",
        tags: ["Mock Tests"],
      },
    },
  );
