import type { Actor } from "@common/auth-types";
import { BadRequestError, ConflictError } from "@common/errors";
import { assertAccess, assertExists } from "@common/utils";
import type { DbTransaction } from "@db/index";
import { db, notDeleted, table } from "@db/index";
import type { SubmissionAnswer } from "@db/types/answers";
import type { ExamBlueprint } from "@db/types/grading";
import { and, eq, sql } from "drizzle-orm";
import { SESSION_COLUMNS } from "./schema";

/** Extract all questionIds from an exam blueprint */
function blueprintQuestionIds(bp: ExamBlueprint): Set<string> {
  const ids = new Set<string>();
  for (const skill of [
    "listening",
    "reading",
    "writing",
    "speaking",
  ] as const) {
    for (const id of bp[skill]?.questionIds ?? []) ids.add(id);
  }
  return ids;
}

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
      examId: table.examSessions.examId,
    })
    .from(table.examSessions)
    .where(
      and(eq(table.examSessions.id, sessionId), notDeleted(table.examSessions)),
    )
    .limit(1);

  const s = assertExists(session, "Session");
  assertAccess(s.userId, actor, "You do not have access to this session");

  if (s.status !== "in_progress") {
    throw new ConflictError("Session is not in progress");
  }

  return s;
}

/** Load blueprint question IDs for a session's exam (cached per tx) */
async function loadBlueprintIds(tx: DbTransaction, examId: string) {
  const exam = assertExists(
    await tx.query.exams.findFirst({
      where: eq(table.exams.id, examId),
      columns: { blueprint: true },
    }),
    "Exam",
  );
  return blueprintQuestionIds(exam.blueprint as ExamBlueprint);
}

export async function startExamSession(userId: string, examId: string) {
  return db.transaction(async (tx) => {
    const exam = assertExists(
      await tx.query.exams.findFirst({
        where: and(eq(table.exams.id, examId), notDeleted(table.exams)),
        columns: { id: true, isActive: true },
      }),
      "Exam",
    );

    if (!exam.isActive) throw new BadRequestError("Exam is not active");

    const [existing] = await tx
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

    if (existing) return existing;

    const [session] = await tx
      .insert(table.examSessions)
      .values({
        userId,
        examId,
        status: "in_progress",
        startedAt: new Date().toISOString(),
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
    columns: { deletedAt: false },
  });

  const s = assertExists(session, "Session");
  assertAccess(s.userId, actor, "You do not have access to this session");
  return s;
}

export async function submitExamAnswer(
  sessionId: string,
  body: { questionId: string; answer: SubmissionAnswer },
  actor: Actor,
) {
  return db.transaction(async (tx) => {
    const session = await getActiveSession(tx, sessionId, actor);
    const allowed = await loadBlueprintIds(tx, session.examId);
    if (!allowed.has(body.questionId)) {
      throw new BadRequestError("Question is not part of this exam");
    }

    await tx
      .insert(table.examAnswers)
      .values({ sessionId, questionId: body.questionId, answer: body.answer })
      .onConflictDoUpdate({
        target: [table.examAnswers.sessionId, table.examAnswers.questionId],
        set: { answer: body.answer, updatedAt: new Date().toISOString() },
      });

    return { success: true };
  });
}

export async function saveExamAnswers(
  sessionId: string,
  answers: { questionId: string; answer: SubmissionAnswer }[],
  actor: Actor,
) {
  return db.transaction(async (tx) => {
    const session = await getActiveSession(tx, sessionId, actor);
    const allowed = await loadBlueprintIds(tx, session.examId);

    const invalid = answers
      .map((a) => a.questionId)
      .filter((id) => !allowed.has(id));
    if (invalid.length > 0) {
      throw new BadRequestError(
        `Questions not part of this exam: ${invalid.join(", ")}`,
      );
    }

    const ts = new Date().toISOString();
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
        set: { answer: sql`excluded.answer`, updatedAt: ts },
      });

    return { success: true, saved: answers.length };
  });
}
