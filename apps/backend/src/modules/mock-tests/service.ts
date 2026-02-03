/**
 * Mock Tests Module Service
 * Business logic for mock test management
 */

import { assertExists, toISOString, toISOStringRequired } from "@common/utils";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db, table } from "@/db";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/plugins/error";
import type { MockTestModel, MockTestStatus } from "./model";

const mapMockTestResponse = (test: any): MockTestModel.MockTest => ({
  id: test.id,
  level: test.level,
  blueprint: test.blueprint,
  isActive: test.isActive,
  createdBy: test.createdBy,
  createdAt: toISOStringRequired(test.createdAt),
  updatedAt: toISOStringRequired(test.updatedAt),
});

const mapSessionResponse = (session: any): MockTestModel.MockTestSession => ({
  id: session.id,
  userId: session.userId,
  mockTestId: session.mockTestId,
  status: session.status as typeof MockTestStatus.static,
  listeningScore: session.listeningScore,
  readingScore: session.readingScore,
  writingScore: session.writingScore,
  speakingScore: session.speakingScore,
  overallExamScore: session.overallExamScore,
  sectionScores: session.sectionScores,
  startedAt: toISOStringRequired(session.startedAt),
  completedAt: toISOString(session.completedAt),
  createdAt: toISOStringRequired(session.createdAt),
  updatedAt: toISOStringRequired(session.updatedAt),
});

/**
 * Mock test service with static methods
 */
export abstract class MockTestService {
  /**
   * Get mock test by ID
   */
  static async getById(id: string): Promise<MockTestModel.MockTest> {
    const [test] = await db
      .select()
      .from(table.mockTests)
      .where(and(eq(table.mockTests.id, id), isNull(table.mockTests.deletedAt)))
      .limit(1);

    if (!test) {
      throw new NotFoundError("Mock test not found");
    }

    return mapMockTestResponse(test);
  }

  /**
   * List mock tests
   */
  static async list(
    query: MockTestModel.ListMockTestsQuery,
  ): Promise<MockTestModel.ListMockTestsResponse> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [isNull(table.mockTests.deletedAt)];
    if (query.level) conditions.push(eq(table.mockTests.level, query.level));
    if (query.isActive !== undefined)
      conditions.push(eq(table.mockTests.isActive, query.isActive));

    const whereClause = and(...conditions);

    const [countResult] = await db
      .select({ count: count() })
      .from(table.mockTests)
      .where(whereClause);

    const total = countResult?.count || 0;

    const tests = await db
      .select()
      .from(table.mockTests)
      .where(whereClause)
      .orderBy(desc(table.mockTests.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: tests.map(mapMockTestResponse),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create mock test (Admin only)
   */
  static async create(
    userId: string,
    body: MockTestModel.CreateMockTestBody,
  ): Promise<MockTestModel.MockTest> {
    const [test] = await db
      .insert(table.mockTests)
      .values({
        ...body,
        createdBy: userId,
      })
      .returning();

    return mapMockTestResponse(assertExists(test, "Mock test"));
  }

  /**
   * Update mock test (Admin only)
   */
  static async update(
    id: string,
    body: MockTestModel.UpdateMockTestBody,
  ): Promise<MockTestModel.MockTest> {
    const [test] = await db
      .update(table.mockTests)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(table.mockTests.id, id))
      .returning();

    if (!test) {
      throw new NotFoundError("Mock test not found");
    }

    return mapMockTestResponse(test);
  }

  /**
   * Start a mock test session
   */
  static async startSession(
    userId: string,
    body: MockTestModel.CreateSessionBody,
  ): Promise<MockTestModel.MockTestSession> {
    // Check if test exists and is active
    const test = await MockTestService.getById(body.mockTestId);
    if (!test.isActive) {
      throw new BadRequestError("Mock test is not active");
    }

    // Check for existing in-progress session
    const [existingSession] = await db
      .select()
      .from(table.mockTestSessions)
      .where(
        and(
          eq(table.mockTestSessions.userId, userId),
          eq(table.mockTestSessions.mockTestId, body.mockTestId),
          eq(table.mockTestSessions.status, "in_progress"),
          isNull(table.mockTestSessions.deletedAt),
        ),
      )
      .limit(1);

    if (existingSession) {
      return mapSessionResponse(existingSession);
    }

    const [session] = await db
      .insert(table.mockTestSessions)
      .values({
        userId,
        mockTestId: body.mockTestId,
        status: "in_progress",
        startedAt: new Date(),
      })
      .returning();

    return mapSessionResponse(assertExists(session, "Session"));
  }

  /**
   * Get session by ID
   */
  static async getSessionById(
    sessionId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<MockTestModel.MockTestSession> {
    const [session] = await db
      .select()
      .from(table.mockTestSessions)
      .where(
        and(
          eq(table.mockTestSessions.id, sessionId),
          isNull(table.mockTestSessions.deletedAt),
        ),
      )
      .limit(1);

    if (!session) {
      throw new NotFoundError("Session not found");
    }

    if (session.userId !== userId && !isAdmin) {
      throw new ForbiddenError("You do not have access to this session");
    }

    return mapSessionResponse(session);
  }

  /**
   * Submit an answer for a session
   */
  static async submitAnswer(
    sessionId: string,
    userId: string,
    body: MockTestModel.SubmitAnswerBody,
  ): Promise<{ success: boolean }> {
    const session = await MockTestService.getSessionById(
      sessionId,
      userId,
      false,
    );
    if (session.status !== "in_progress") {
      throw new BadRequestError("Session is not in progress");
    }

    await db
      .insert(table.mockTestSessionAnswers)
      .values({
        sessionId,
        questionId: body.questionId,
        answer: body.answer,
      })
      .onConflictDoUpdate({
        target: [
          table.mockTestSessionAnswers.sessionId,
          table.mockTestSessionAnswers.questionId,
        ],
        set: {
          answer: body.answer,
          updatedAt: new Date(),
        },
      });

    return { success: true };
  }

  /**
   * Complete a session
   */
  static async completeSession(
    sessionId: string,
    userId: string,
  ): Promise<MockTestModel.MockTestSession> {
    const session = await MockTestService.getSessionById(
      sessionId,
      userId,
      false,
    );
    if (session.status !== "in_progress") {
      throw new BadRequestError("Session is not in progress");
    }

    const [updatedSession] = await db
      .update(table.mockTestSessions)
      .set({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(table.mockTestSessions.id, sessionId))
      .returning();

    return mapSessionResponse(assertExists(updatedSession, "Session"));
  }
}
