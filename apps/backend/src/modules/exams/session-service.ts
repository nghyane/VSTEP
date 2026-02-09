import type { SubmissionAnswer } from "@common/answer-schemas";
import { EXAM_MESSAGES } from "@common/messages";
import { assertAccess, assertExists, now } from "@common/utils";
import type { DbTransaction } from "@db/index";
import { db, notDeleted, table } from "@db/index";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { Actor } from "@/plugins/auth";
import { BadRequestError, ConflictError } from "@/plugins/error";
import { SESSION_COLUMNS, SESSION_QUERY_COLUMNS } from "./service";

/** Fetch and validate an in-progress session owned by the actor */
export async function getActiveSession(
  tx: DbTransaction,
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
  assertAccess(s.userId, actor, EXAM_MESSAGES.noSessionAccess);

  if (s.status !== "in_progress") {
    throw new ConflictError(EXAM_MESSAGES.sessionNotInProgress);
  }

  return s;
}

export async function startExamSession(userId: string, examId: string) {
  return db.transaction(async (tx) => {
    const examRow = await tx.query.exams.findFirst({
      where: and(eq(table.exams.id, examId), notDeleted(table.exams)),
      columns: { id: true, isActive: true },
    });

    const exam = assertExists(examRow, "Exam");
    if (!exam.isActive) {
      throw new BadRequestError(EXAM_MESSAGES.notActive);
    }

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

export async function getExamSessionById(sessionId: string, actor: Actor) {
  const session = await db.query.examSessions.findFirst({
    where: and(
      eq(table.examSessions.id, sessionId),
      notDeleted(table.examSessions),
    ),
    columns: SESSION_QUERY_COLUMNS,
  });

  const s = assertExists(session, "Session");
  assertAccess(s.userId, actor, EXAM_MESSAGES.noSessionAccess);
  return s;
}

/** Validate that a questionId exists, is active, and is not soft-deleted */
async function validateQuestion(tx: DbTransaction, questionId: string) {
  const [question] = await tx
    .select({ id: table.questions.id })
    .from(table.questions)
    .where(
      and(
        eq(table.questions.id, questionId),
        eq(table.questions.isActive, true),
        notDeleted(table.questions),
      ),
    )
    .limit(1);

  if (!question) {
    throw new BadRequestError(EXAM_MESSAGES.invalidOrInactiveQuestion);
  }
}

/** Submit answer inside a transaction to prevent TOCTOU race */
export async function submitExamAnswer(
  sessionId: string,
  body: { questionId: string; answer: SubmissionAnswer },
  actor: Actor,
): Promise<{ success: boolean }> {
  return db.transaction(async (tx) => {
    await getActiveSession(tx, sessionId, actor);
    await validateQuestion(tx, body.questionId);

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
export async function saveExamAnswers(
  sessionId: string,
  answers: { questionId: string; answer: SubmissionAnswer }[],
  actor: Actor,
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
    await tx
      .insert(table.examAnswers)
      .values(
        answers.map(({ questionId, answer }) => ({
          sessionId,
          questionId,
          answer,
        })),
      )
      .onConflictDoUpdate({
        target: [table.examAnswers.sessionId, table.examAnswers.questionId],
        set: {
          answer: sql`excluded.answer`,
          updatedAt: timestamp,
        },
      });

    return { success: true, saved: answers.length };
  });
}
