import { assertAccess, assertExists, now } from "@common/utils";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import type { Exam } from "@/db";
import { db, notDeleted, pagination, table } from "@/db";
import type { Actor } from "@/plugins/auth";
import { BadRequestError } from "@/plugins/error";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

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

/** Fetch and validate an in-progress session owned by the actor */
async function getActiveSession(
  tx: Transaction,
  sessionId: string,
  actor: Actor,
) {
  const [session] = await tx
    .select({
      id: table.examSessions.id,
      status: table.examSessions.status,
      userId: table.examSessions.userId,
    })
    .from(table.examSessions)
    .where(
      and(eq(table.examSessions.id, sessionId), notDeleted(table.examSessions)),
    )
    .limit(1);

  const s = assertExists(session, "Session");
  assertAccess(s.userId, actor, "You do not have access to this session");

  if (s.status !== "in_progress") {
    throw new BadRequestError("Session is not in progress");
  }

  return s;
}

export class ExamService {
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

    return assertExists(exam, "Exam");
  }

  static async list(query: {
    page?: number;
    limit?: number;
    level?: Exam["level"];
    isActive?: boolean;
  }) {
    const pg = pagination(query.page, query.limit);

    const conditions = [notDeleted(table.exams)];
    if (query.level) conditions.push(eq(table.exams.level, query.level));
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
      .limit(pg.limit)
      .offset(pg.offset);

    return {
      data: exams,
      meta: pg.meta(total),
    };
  }

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

    return assertExists(exam, "Exam");
  }

  static async update(
    id: string,
    body: Partial<{
      level: Exam["level"];
      blueprint: unknown;
      isActive: boolean;
    }>,
  ) {
    const updateValues: Partial<typeof table.exams.$inferInsert> = {
      updatedAt: now(),
    };
    if (body.level !== undefined) updateValues.level = body.level;
    if (body.blueprint !== undefined) updateValues.blueprint = body.blueprint;
    if (body.isActive !== undefined) updateValues.isActive = body.isActive;

    const [exam] = await db
      .update(table.exams)
      .set(updateValues)
      .where(and(eq(table.exams.id, id), notDeleted(table.exams)))
      .returning(EXAM_COLUMNS);

    return assertExists(exam, "Exam");
  }

  static async startSession(userId: string, examId: string) {
    const exam = await ExamService.getById(examId);
    if (!exam.isActive) {
      throw new BadRequestError("Exam is not active");
    }

    return db.transaction(async (tx) => {
      const [existingSession] = await tx
        .select(SESSION_COLUMNS)
        .from(table.examSessions)
        .where(
          and(
            eq(table.examSessions.userId, userId),
            eq(table.examSessions.examId, examId),
            eq(table.examSessions.status, "in_progress"),
            notDeleted(table.examSessions),
          ),
        )
        .limit(1);

      if (existingSession) {
        return existingSession;
      }

      const [session] = await tx
        .insert(table.examSessions)
        .values({
          userId,
          examId,
          status: "in_progress",
          startedAt: now(),
        })
        .returning(SESSION_COLUMNS);

      return assertExists(session, "Session");
    });
  }

  static async getSessionById(sessionId: string, actor: Actor) {
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

    const s = assertExists(session, "Session");
    assertAccess(s.userId, actor, "You do not have access to this session");
    return s;
  }

  /** Validate that a questionId exists and is active */
  private static async validateQuestion(tx: Transaction, questionId: string) {
    const [question] = await tx
      .select({ id: table.questions.id })
      .from(table.questions)
      .where(
        and(
          eq(table.questions.id, questionId),
          eq(table.questions.isActive, true),
        ),
      )
      .limit(1);

    if (!question) {
      throw new BadRequestError("Invalid or inactive question");
    }
  }

  /** Submit answer inside a transaction to prevent TOCTOU race */
  static async submitAnswer(
    sessionId: string,
    actor: Actor,
    body: { questionId: string; answer: unknown },
  ): Promise<{ success: boolean }> {
    return db.transaction(async (tx) => {
      await getActiveSession(tx, sessionId, actor);
      await ExamService.validateQuestion(tx, body.questionId);

      await tx
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
            updatedAt: now(),
          },
        });

      return { success: true };
    });
  }

  /** Bulk upsert answers for auto-save */
  static async saveAnswers(
    sessionId: string,
    actor: Actor,
    answers: { questionId: string; answer: unknown }[],
  ): Promise<{ success: boolean; saved: number }> {
    return db.transaction(async (tx) => {
      await getActiveSession(tx, sessionId, actor);

      // Batch validate all questions
      const questionIds = answers.map((a) => a.questionId);
      const validQuestions = await tx
        .select({ id: table.questions.id })
        .from(table.questions)
        .where(
          and(
            inArray(table.questions.id, questionIds),
            eq(table.questions.isActive, true),
          ),
        );
      const validIds = new Set(validQuestions.map((q) => q.id));
      const invalidIds = questionIds.filter((id) => !validIds.has(id));
      if (invalidIds.length > 0) {
        throw new BadRequestError(
          `Invalid or inactive questions: ${invalidIds.join(", ")}`,
        );
      }

      const timestamp = now();
      for (const { questionId, answer } of answers) {
        await tx
          .insert(table.examAnswers)
          .values({ sessionId, questionId, answer })
          .onConflictDoUpdate({
            target: [table.examAnswers.sessionId, table.examAnswers.questionId],
            set: { answer, updatedAt: timestamp },
          });
      }

      return { success: true, saved: answers.length };
    });
  }

  /** Auto-grade listening/reading answers against question answerKeys */
  private static autoGradeAnswers(
    examAnswers: { questionId: string; answer: unknown }[],
    questionsMap: Map<string, { skill: string; answerKey: unknown }>,
  ) {
    let listeningCorrect = 0;
    let listeningTotal = 0;
    let readingCorrect = 0;
    let readingTotal = 0;
    const writingAnswers: { questionId: string; answer: unknown }[] = [];
    const speakingAnswers: { questionId: string; answer: unknown }[] = [];

    for (const ea of examAnswers) {
      const question = questionsMap.get(ea.questionId);
      if (!question) continue;

      const { skill, answerKey } = question;

      if (skill === "listening" || skill === "reading") {
        const correctAnswers =
          (answerKey as { correctAnswers?: Record<string, string> })
            ?.correctAnswers ?? {};
        const userAnswers = (ea.answer ?? {}) as Record<string, string>;

        for (const [key, correctValue] of Object.entries(correctAnswers)) {
          const userValue = userAnswers[key];
          const isCorrect =
            userValue != null &&
            userValue.trim().toLowerCase() ===
              correctValue.trim().toLowerCase();
          if (skill === "listening") {
            listeningTotal++;
            if (isCorrect) listeningCorrect++;
          } else {
            readingTotal++;
            if (isCorrect) readingCorrect++;
          }
        }
      } else if (skill === "writing") {
        writingAnswers.push(ea);
      } else if (skill === "speaking") {
        speakingAnswers.push(ea);
      }
    }

    return {
      listeningCorrect,
      listeningTotal,
      readingCorrect,
      readingTotal,
      writingAnswers,
      speakingAnswers,
    };
  }

  /** Calculate score: (correct / total) * 10, rounded to nearest 0.5 */
  private static calculateScore(correct: number, total: number): number | null {
    return total === 0 ? null : Math.round((correct / total) * 10 * 2) / 2;
  }

  /** Create a submission + submissionDetail + examSubmissions link for a writing/speaking answer */
  private static async createSubmissionForExam(
    tx: Transaction,
    userId: string,
    sessionId: string,
    questionId: string,
    answer: unknown,
    skill: "writing" | "speaking",
  ) {
    const [submission] = await tx
      .insert(table.submissions)
      .values({
        userId,
        questionId,
        skill,
        status: "pending",
      })
      .returning({ id: table.submissions.id });

    const submissionId = assertExists(submission, "Submission").id;

    await tx.insert(table.submissionDetails).values({
      submissionId,
      answer,
    });

    await tx.insert(table.examSubmissions).values({
      sessionId,
      submissionId,
      skill,
    });
  }

  /** Submit exam: auto-grade listening/reading, create submissions for writing/speaking */
  static async submitExam(sessionId: string, actor: Actor) {
    return db.transaction(async (tx) => {
      const session = await getActiveSession(tx, sessionId, actor);

      // Fetch all exam answers for this session
      const answers = await tx
        .select({
          questionId: table.examAnswers.questionId,
          answer: table.examAnswers.answer,
        })
        .from(table.examAnswers)
        .where(eq(table.examAnswers.sessionId, sessionId));

      if (answers.length === 0) {
        throw new BadRequestError("No answers found for this session");
      }

      // Batch-fetch questions for those answers
      const questionIds = answers.map((a) => a.questionId);
      const questionsRows = await tx
        .select({
          id: table.questions.id,
          skill: table.questions.skill,
          answerKey: table.questions.answerKey,
        })
        .from(table.questions)
        .where(inArray(table.questions.id, questionIds));

      const questionsMap = new Map(
        questionsRows.map((q) => [
          q.id,
          { skill: q.skill, answerKey: q.answerKey },
        ]),
      );

      // Auto-grade listening/reading, collect writing/speaking
      const gradeResult = ExamService.autoGradeAnswers(answers, questionsMap);

      // Calculate scores
      const listeningScore = ExamService.calculateScore(
        gradeResult.listeningCorrect,
        gradeResult.listeningTotal,
      );
      const readingScore = ExamService.calculateScore(
        gradeResult.readingCorrect,
        gradeResult.readingTotal,
      );

      // For writing/speaking: create submission + submissionDetail + examSubmissions link
      let hasPendingSubmissions = false;

      for (const wa of [
        ...gradeResult.writingAnswers.map((a) => ({
          ...a,
          skill: "writing" as const,
        })),
        ...gradeResult.speakingAnswers.map((a) => ({
          ...a,
          skill: "speaking" as const,
        })),
      ]) {
        hasPendingSubmissions = true;
        await ExamService.createSubmissionForExam(
          tx,
          session.userId,
          sessionId,
          wa.questionId,
          wa.answer,
          wa.skill,
        );
      }

      // Update session: scores + status
      const finalStatus = hasPendingSubmissions ? "submitted" : "completed";
      const timestamp = now();

      const [updatedSession] = await tx
        .update(table.examSessions)
        .set({
          listeningScore,
          readingScore,
          status: finalStatus,
          completedAt: timestamp,
          updatedAt: timestamp,
        })
        .where(
          and(
            eq(table.examSessions.id, sessionId),
            eq(table.examSessions.status, "in_progress"),
          ),
        )
        .returning(SESSION_COLUMNS);

      return assertExists(updatedSession, "Session");
    });
  }
}
