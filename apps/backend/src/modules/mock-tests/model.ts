import { t } from "elysia";
import {
  IdParam,
  PaginationMeta,
  PaginationQuery,
  spread,
} from "@/common/schemas";

/**
 * Mock test status
 */
export const MockTestStatus = t.Union([
  t.Literal("in_progress"),
  t.Literal("completed"),
  t.Literal("abandoned"),
]);

/**
 * Question levels (re-used from questions)
 */
export const MockTestLevel = t.Union([
  t.Literal("A2"),
  t.Literal("B1"),
  t.Literal("B2"),
  t.Literal("C1"),
]);

/**
 * Mock Test Model Namespace
 */
export namespace MockTestModel {
  /**
   * Mock test schema
   */
  export const mockTest = t.Object({
    id: t.String({ format: "uuid" }),
    level: MockTestLevel,
    blueprint: t.Any(),
    isActive: t.Boolean(),
    createdBy: t.Optional(t.Nullable(t.String({ format: "uuid" }))),
    createdAt: t.String({ format: "date-time" }),
    updatedAt: t.String({ format: "date-time" }),
  });
  export type MockTest = typeof mockTest.static;

  /**
   * Mock test session schema
   */
  export const mockTestSession = t.Object({
    id: t.String({ format: "uuid" }),
    userId: t.String({ format: "uuid" }),
    mockTestId: t.String({ format: "uuid" }),
    status: MockTestStatus,
    listeningScore: t.Optional(t.Nullable(t.Number())),
    readingScore: t.Optional(t.Nullable(t.Number())),
    writingScore: t.Optional(t.Nullable(t.Number())),
    speakingScore: t.Optional(t.Nullable(t.Number())),
    overallExamScore: t.Optional(t.Nullable(t.Number())),
    sectionScores: t.Optional(t.Nullable(t.Any())),
    startedAt: t.String({ format: "date-time" }),
    completedAt: t.Optional(t.Nullable(t.String({ format: "date-time" }))),
    createdAt: t.String({ format: "date-time" }),
    updatedAt: t.String({ format: "date-time" }),
  });
  export type MockTestSession = typeof mockTestSession.static;

  /**
   * Mock test ID parameter
   */
  export const mockTestIdParam = IdParam;
  export type MockTestIdParam = typeof mockTestIdParam.static;

  /**
   * Session ID parameter
   */
  export const sessionIdParam = t.Object({
    sessionId: t.String({ format: "uuid" }),
  });
  export type SessionIdParam = typeof sessionIdParam.static;

  /**
   * Create mock test body
   */
  export const createMockTestBody = t.Object({
    level: MockTestLevel,
    blueprint: t.Any(),
    isActive: t.Optional(t.Boolean({ default: true })),
  });
  export type CreateMockTestBody = typeof createMockTestBody.static;

  /**
   * Update mock test body
   */
  export const updateMockTestBody = t.Partial(createMockTestBody);
  export type UpdateMockTestBody = typeof updateMockTestBody.static;

  /**
   * Create session body
   */
  export const createSessionBody = t.Object({
    mockTestId: t.String({ format: "uuid" }),
  });
  export type CreateSessionBody = typeof createSessionBody.static;

  /**
   * Submit answer body
   */
  export const submitAnswerBody = t.Object({
    questionId: t.String({ format: "uuid" }),
    answer: t.Any(),
  });
  export type SubmitAnswerBody = typeof submitAnswerBody.static;

  /**
   * Query parameters for listing mock tests
   */
  export const listMockTestsQuery = t.Object({
    ...spread(PaginationQuery),
    level: t.Optional(MockTestLevel),
    isActive: t.Optional(t.Boolean()),
  });
  export type ListMockTestsQuery = typeof listMockTestsQuery.static;

  /**
   * List mock tests response
   */
  export const listMockTestsResponse = t.Object({
    data: t.Array(mockTest),
    meta: PaginationMeta,
  });
  export type ListMockTestsResponse = typeof listMockTestsResponse.static;

  /**
   * List sessions query
   */
  export const listSessionsQuery = t.Object({
    ...spread(PaginationQuery),
    status: t.Optional(MockTestStatus),
    userId: t.Optional(t.String({ format: "uuid" })),
  });
  export type ListSessionsQuery = typeof listSessionsQuery.static;
}
