/**
 * Exams Module Service
 * Business logic for exam management
 */

import { assertExists } from "@common/utils";
import { and, count, desc, eq } from "drizzle-orm";
import type { Exam, ExamSession } from "@/db";
import { db, notDeleted, paginate, paginationMeta, table } from "@/db";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/plugins/error";

// ─── Response Types ──────────────────────────────────────────────

interface ExamResponse {
  id: string;
  level: string;
  blueprint: unknown;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ExamSessionResponse {
  id: string;
  userId: string;
  examId: string;
  status: string;
  listeningScore: number | null;
  readingScore: number | null;
  writingScore: number | null;
  speakingScore: number | null;
  overallScore: number | null;
  skillScores: unknown;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Mappers ─────────────────────────────────────────────────────

const mapExamResponse = (exam: Exam): ExamResponse => ({
  id: exam.id,
  level: exam.level,
  blueprint: exam.blueprint,
  isActive: exam.isActive,
  createdBy: exam.createdBy,
  createdAt: exam.createdAt.toISOString(),
  updatedAt: exam.updatedAt.toISOString(),
});

const mapSessionResponse = (session: ExamSession): ExamSessionResponse => ({
  id: session.id,
  userId: session.userId,
  examId: session.examId,
  status: session.status,
  listeningScore: session.listeningScore,
  readingScore: session.readingScore,
  writingScore: session.writingScore,
  speakingScore: session.speakingScore,
  overallScore: session.overallScore,
  skillScores: session.skillScores,
  startedAt: session.startedAt.toISOString(),
  completedAt: session.completedAt?.toISOString() ?? null,
  createdAt: session.createdAt.toISOString(),
  updatedAt: session.updatedAt.toISOString(),
});

/**
 * Exam service with static methods
 */
export abstract class ExamService {
  /**
   * Get exam by ID
   */
  static async getById(id: string): Promise<ExamResponse> {
    const exam = await db.query.exams.findFirst({
      where: and(eq(table.exams.id, id), notDeleted(table.exams)),
    });

    if (!exam) {
      throw new NotFoundError("Exam not found");
    }

    return mapExamResponse(exam);
  }

  /**
   * List exams
   */
  static async list(query: {
    page?: number;
    limit?: number;
    level?: string;
    isActive?: boolean;
  }) {
    const { limit, offset } = paginate(query.page, query.limit);

    const conditions = [notDeleted(table.exams)];
    if (query.level)
      conditions.push(eq(table.exams.level, query.level as Exam["level"]));
    if (query.isActive !== undefined)
      conditions.push(eq(table.exams.isActive, query.isActive));

    const whereClause = and(...conditions);

    const [countResult] = await db
      .select({ count: count() })
      .from(table.exams)
      .where(whereClause);

    const total = countResult?.count ?? 0;

    const exams = await db
      .select()
      .from(table.exams)
      .where(whereClause)
      .orderBy(desc(table.exams.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: exams.map(mapExamResponse),
      meta: paginationMeta(total, query.page, query.limit),
    };
  }

  /**
   * Create exam (Admin only)
   */
  static async create(
    userId: string,
    body: { level: Exam["level"]; blueprint: unknown; isActive?: boolean },
  ): Promise<ExamResponse> {
    const [exam] = await db
      .insert(table.exams)
      .values({
        level: body.level,
        blueprint: body.blueprint,
        isActive: body.isActive ?? true,
        createdBy: userId,
      })
      .returning();

    return mapExamResponse(assertExists(exam, "Exam"));
  }

  /**
   * Update exam (Admin only)
   */
  static async update(
    id: string,
    body: Partial<{
      level: Exam["level"];
      blueprint: unknown;
      isActive: boolean;
    }>,
  ): Promise<ExamResponse> {
    const [exam] = await db
      .update(table.exams)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(and(eq(table.exams.id, id), notDeleted(table.exams)))
      .returning();

    if (!exam) {
      throw new NotFoundError("Exam not found");
    }

    return mapExamResponse(exam);
  }

  /**
   * Start an exam session
   */
  static async startSession(
    userId: string,
    body: { examId: string },
  ): Promise<ExamSessionResponse> {
    // Check if exam exists and is active
    const exam = await ExamService.getById(body.examId);
    if (!exam.isActive) {
      throw new BadRequestError("Exam is not active");
    }

    // Check for existing in-progress session
    const existingSession = await db.query.examSessions.findFirst({
      where: and(
        eq(table.examSessions.userId, userId),
        eq(table.examSessions.examId, body.examId),
        eq(table.examSessions.status, "in_progress"),
        notDeleted(table.examSessions),
      ),
    });

    if (existingSession) {
      return mapSessionResponse(existingSession);
    }

    const [session] = await db
      .insert(table.examSessions)
      .values({
        userId,
        examId: body.examId,
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
  ): Promise<ExamSessionResponse> {
    const session = await db.query.examSessions.findFirst({
      where: and(
        eq(table.examSessions.id, sessionId),
        notDeleted(table.examSessions),
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
    const session = await ExamService.getSessionById(sessionId, userId, false);
    if (session.status !== "in_progress") {
      throw new BadRequestError("Session is not in progress");
    }

    await db
      .insert(table.examAnswers)
      .values({
        sessionId,
        questionId: body.questionId,
        answer: body.answer,
      })
      .onConflictDoUpdate({
        target: [table.examAnswers.sessionId, table.examAnswers.questionId],
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
  ): Promise<ExamSessionResponse> {
    const session = await ExamService.getSessionById(sessionId, userId, false);
    if (session.status !== "in_progress") {
      throw new BadRequestError("Session is not in progress");
    }

    const [updatedSession] = await db
      .update(table.examSessions)
      .set({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(table.examSessions.id, sessionId))
      .returning();

    return mapSessionResponse(assertExists(updatedSession, "Session"));
  }
}
