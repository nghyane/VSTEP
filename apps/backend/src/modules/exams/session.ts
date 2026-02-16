import type { Actor } from "@common/auth-types";
import { BadRequestError, ConflictError } from "@common/errors";
import { assertAccess, assertExists } from "@common/utils";
import type { DbTransaction } from "@db/index";
import { db, table, takeFirstOrThrow } from "@db/index";
import type { SubmissionAnswer } from "@db/types/answers";
import type { ExamBlueprint } from "@db/types/grading";
import { and, eq, sql } from "drizzle-orm";
import { SESSION_COLUMNS } from "./schema";

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

export async function active(
  tx: DbTransaction,
  sessionId: string,
  actor: Actor,
) {
  const [found] = await tx
    .select({
      id: table.examSessions.id,
      status: table.examSessions.status,
      userId: table.examSessions.userId,
      examId: table.examSessions.examId,
    })
    .from(table.examSessions)
    .where(eq(table.examSessions.id, sessionId))
    .limit(1);

  const session = assertExists(found, "Session");
  assertAccess(session.userId, actor, "You do not have access to this session");

  if (session.status !== "in_progress") {
    throw new ConflictError("Session is not in progress");
  }

  return session;
}

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

export async function start(userId: string, examId: string) {
  return db.transaction(async (tx) => {
    // Lock exam row to serialize concurrent session creation for the same exam
    const [found] = await tx
      .select({ id: table.exams.id, isActive: table.exams.isActive })
      .from(table.exams)
      .where(eq(table.exams.id, examId))
      .for("update")
      .limit(1);

    const exam = assertExists(found, "Exam");
    if (!exam.isActive) throw new BadRequestError("Exam is not active");

    const [existing] = await tx
      .select(SESSION_COLUMNS)
      .from(table.examSessions)
      .where(
        and(
          eq(table.examSessions.userId, userId),
          eq(table.examSessions.examId, examId),
          eq(table.examSessions.status, "in_progress"),
        ),
      )
      .limit(1);

    if (existing) return existing;

    return tx
      .insert(table.examSessions)
      .values({
        userId,
        examId,
        status: "in_progress",
        startedAt: new Date().toISOString(),
      })
      .returning(SESSION_COLUMNS)
      .then(takeFirstOrThrow);
  });
}

export async function findSession(sessionId: string, actor: Actor) {
  const found = await db.query.examSessions.findFirst({
    where: eq(table.examSessions.id, sessionId),
  });

  const session = assertExists(found, "Session");
  assertAccess(session.userId, actor, "You do not have access to this session");
  return session;
}

export async function answer(
  sessionId: string,
  body: { questionId: string; answer: SubmissionAnswer },
  actor: Actor,
) {
  return db.transaction(async (tx) => {
    const session = await active(tx, sessionId, actor);
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

const MAX_ANSWERS_PER_REQUEST = 200;

export async function saveAnswers(
  sessionId: string,
  answers: { questionId: string; answer: SubmissionAnswer }[],
  actor: Actor,
) {
  if (answers.length === 0) {
    throw new BadRequestError("At least one answer is required");
  }
  if (answers.length > MAX_ANSWERS_PER_REQUEST) {
    throw new BadRequestError(
      `Maximum ${MAX_ANSWERS_PER_REQUEST} answers per request`,
    );
  }

  return db.transaction(async (tx) => {
    const session = await active(tx, sessionId, actor);
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
