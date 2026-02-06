/**
 * Exams Module Service
 * Business logic for exam management
 */

import { assertExists, serializeDates } from "@common/utils";
import { and, count, desc, eq } from "drizzle-orm";
import type { Exam } from "@/db";
import { db, notDeleted, paginate, paginationMeta, table } from "@/db";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/plugins/error";

const EXAM_COLUMNS = {
  id: table.exams.id,
  level: table.exams.level,
  blueprint: table.exams.blueprint,
  isActive: table.exams.isActive,
  createdBy: table.exams.createdBy,
  createdAt: table.exams.createdAt,
  updatedAt: table.exams.updatedAt,
} as const;

const SESSION_COLUMNS = {
  id: table.examSessions.id,
  userId: table.examSessions.userId,
  examId: table.examSessions.examId,
  status: table.examSessions.status,
  listeningScore: table.examSessions.listeningScore,
  readingScore: table.examSessions.readingScore,
  writingScore: table.examSessions.writingScore,
  speakingScore: table.examSessions.speakingScore,
  overallScore: table.examSessions.overallScore,
  skillScores: table.examSessions.skillScores,
  startedAt: table.examSessions.startedAt,
  completedAt: table.examSessions.completedAt,
  createdAt: table.examSessions.createdAt,
  updatedAt: table.examSessions.updatedAt,
} as const;

/**
 * Exam service with static methods
 */
export abstract class ExamService {
  /**
   * Get exam by ID
   */
  static async getById(id: string) {
    const exam = await db.query.exams.findFirst({
      where: and(eq(table.exams.id, id), notDeleted(table.exams)),
      columns: {
        id: true,
        level: true,
        blueprint: true,
        isActive: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!exam) {
      throw new NotFoundError("Exam not found");
    }

    return serializeDates(exam);
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
      .select(EXAM_COLUMNS)
      .from(table.exams)
      .where(whereClause)
      .orderBy(desc(table.exams.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: exams.map(serializeDates),
      meta: paginationMeta(total, query.page, query.limit),
    };
  }

  /**
   * Create exam (Admin only)
   */
  static async create(
    userId: string,
    body: { level: Exam["level"]; blueprint: unknown; isActive?: boolean },
  ) {
    const [exam] = await db
      .insert(table.exams)
      .values({
        level: body.level,
        blueprint: body.blueprint,
        isActive: body.isActive ?? true,
        createdBy: userId,
      })
      .returning(EXAM_COLUMNS);

    return serializeDates(assertExists(exam, "Exam"));
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
  ) {
    const [exam] = await db
      .update(table.exams)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(and(eq(table.exams.id, id), notDeleted(table.exams)))
      .returning(EXAM_COLUMNS);

    if (!exam) {
      throw new NotFoundError("Exam not found");
    }

    return serializeDates(exam);
  }

  /**
   * Start an exam session
   */
  static async startSession(userId: string, body: { examId: string }) {
    // Check if exam exists and is active
    const exam = await ExamService.getById(body.examId);
    if (!exam.isActive) {
      throw new BadRequestError("Exam is not active");
    }

    // Wrap in transaction to prevent duplicate sessions from concurrent requests
    return await db.transaction(async (tx) => {
      // Check for existing in-progress session
      const [existingSession] = await tx
        .select(SESSION_COLUMNS)
        .from(table.examSessions)
        .where(
          and(
            eq(table.examSessions.userId, userId),
            eq(table.examSessions.examId, body.examId),
            eq(table.examSessions.status, "in_progress"),
            notDeleted(table.examSessions),
          ),
        )
        .limit(1);

      if (existingSession) {
        return serializeDates(existingSession);
      }

      const [session] = await tx
        .insert(table.examSessions)
        .values({
          userId,
          examId: body.examId,
          status: "in_progress",
          startedAt: new Date(),
        })
        .returning(SESSION_COLUMNS);

      return serializeDates(assertExists(session, "Session"));
    });
  }

  /**
   * Get session by ID
   */
  static async getSessionById(
    sessionId: string,
    userId: string,
    isAdmin: boolean,
  ) {
    const session = await db.query.examSessions.findFirst({
      where: and(
        eq(table.examSessions.id, sessionId),
        notDeleted(table.examSessions),
      ),
      columns: {
        id: true,
        userId: true,
        examId: true,
        status: true,
        listeningScore: true,
        readingScore: true,
        writingScore: true,
        speakingScore: true,
        overallScore: true,
        skillScores: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!session) {
      throw new NotFoundError("Session not found");
    }

    if (session.userId !== userId && !isAdmin) {
      throw new ForbiddenError("You do not have access to this session");
    }

    return serializeDates(session);
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
  static async completeSession(sessionId: string, userId: string) {
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
      .returning(SESSION_COLUMNS);

    return serializeDates(assertExists(updatedSession, "Session"));
  }
}
