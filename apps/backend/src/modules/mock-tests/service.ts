/**
 * Mock Tests Module Service
 * Business logic for mock test management
 */

import { assertExists } from "@common/utils";
import { and, count, desc, eq } from "drizzle-orm";
import type { MockTest, MockTestSession } from "@/db";
import { db, notDeleted, paginate, paginationMeta, table } from "@/db";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/plugins/error";

// ─── Response Types ──────────────────────────────────────────────

interface MockTestResponse {
  id: string;
  level: string;
  blueprint: unknown;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MockTestSessionResponse {
  id: string;
  userId: string;
  mockTestId: string;
  status: string;
  listeningScore: number | null;
  readingScore: number | null;
  writingScore: number | null;
  speakingScore: number | null;
  overallExamScore: number | null;
  sectionScores: unknown;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Mappers ─────────────────────────────────────────────────────

const mapMockTestResponse = (test: MockTest): MockTestResponse => ({
  id: test.id,
  level: test.level,
  blueprint: test.blueprint,
  isActive: test.isActive,
  createdBy: test.createdBy,
  createdAt: test.createdAt.toISOString(),
  updatedAt: test.updatedAt.toISOString(),
});

const mapSessionResponse = (
  session: MockTestSession,
): MockTestSessionResponse => ({
  id: session.id,
  userId: session.userId,
  mockTestId: session.mockTestId,
  status: session.status,
  listeningScore: session.listeningScore,
  readingScore: session.readingScore,
  writingScore: session.writingScore,
  speakingScore: session.speakingScore,
  overallExamScore: session.overallExamScore,
  sectionScores: session.sectionScores,
  startedAt: session.startedAt.toISOString(),
  completedAt: session.completedAt?.toISOString() ?? null,
  createdAt: session.createdAt.toISOString(),
  updatedAt: session.updatedAt.toISOString(),
});

/**
 * Mock test service with static methods
 */
export abstract class MockTestService {
  /**
   * Get mock test by ID
   */
  static async getById(id: string): Promise<MockTestResponse> {
    const test = await db.query.mockTests.findFirst({
      where: and(eq(table.mockTests.id, id), notDeleted(table.mockTests)),
    });

    if (!test) {
      throw new NotFoundError("Mock test not found");
    }

    return mapMockTestResponse(test);
  }

  /**
   * List mock tests
   */
  static async list(query: {
    page?: number;
    limit?: number;
    level?: string;
    isActive?: boolean;
  }) {
    const { limit, offset } = paginate(query.page, query.limit);

    const conditions = [notDeleted(table.mockTests)];
    if (query.level)
      conditions.push(
        eq(table.mockTests.level, query.level as MockTest["level"]),
      );
    if (query.isActive !== undefined)
      conditions.push(eq(table.mockTests.isActive, query.isActive));

    const whereClause = and(...conditions);

    const [countResult] = await db
      .select({ count: count() })
      .from(table.mockTests)
      .where(whereClause);

    const total = countResult?.count ?? 0;

    const tests = await db
      .select()
      .from(table.mockTests)
      .where(whereClause)
      .orderBy(desc(table.mockTests.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: tests.map(mapMockTestResponse),
      meta: paginationMeta(total, query.page, query.limit),
    };
  }

  /**
   * Create mock test (Admin only)
   */
  static async create(
    userId: string,
    body: { level: MockTest["level"]; blueprint: unknown; isActive?: boolean },
  ): Promise<MockTestResponse> {
    const [test] = await db
      .insert(table.mockTests)
      .values({
        level: body.level,
        blueprint: body.blueprint,
        isActive: body.isActive ?? true,
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
    body: Partial<{
      level: MockTest["level"];
      blueprint: unknown;
      isActive: boolean;
    }>,
  ): Promise<MockTestResponse> {
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
    body: { mockTestId: string },
  ): Promise<MockTestSessionResponse> {
    // Check if test exists and is active
    const test = await MockTestService.getById(body.mockTestId);
    if (!test.isActive) {
      throw new BadRequestError("Mock test is not active");
    }

    // Check for existing in-progress session
    const existingSession = await db.query.mockTestSessions.findFirst({
      where: and(
        eq(table.mockTestSessions.userId, userId),
        eq(table.mockTestSessions.mockTestId, body.mockTestId),
        eq(table.mockTestSessions.status, "in_progress"),
        notDeleted(table.mockTestSessions),
      ),
    });

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
  ): Promise<MockTestSessionResponse> {
    const session = await db.query.mockTestSessions.findFirst({
      where: and(
        eq(table.mockTestSessions.id, sessionId),
        notDeleted(table.mockTestSessions),
      ),
    });

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
    body: { questionId: string; answer: unknown },
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
  ): Promise<MockTestSessionResponse> {
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
