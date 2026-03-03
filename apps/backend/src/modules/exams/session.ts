import type { Actor } from "@common/auth-types";
import { BadRequestError, ConflictError } from "@common/errors";
import { assertAccess, assertExists } from "@common/utils";
import type { DbTransaction } from "@db/index";
import { db, paginate, table, takeFirst, takeFirstOrThrow } from "@db/index";
import { SKILLS } from "@db/schema/enums";
import type { SubmissionAnswer } from "@db/types/answers";
import type { ExamBlueprint } from "@db/types/exam-blueprint";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { SessionListQuery } from "./schema";
import { SESSION_COLUMNS } from "./schema";

function blueprintQuestionIds(bp: ExamBlueprint): Set<string> {
  const ids = new Set<string>();
  for (const skill of SKILLS) {
    for (const id of bp[skill]?.questionIds ?? []) ids.add(id);
  }
  return ids;
}

export async function active(
  tx: DbTransaction,
  sessionId: string,
  actor: Actor,
) {
  const session = assertExists(
    await tx
      .select({
        id: table.examSessions.id,
        status: table.examSessions.status,
        userId: table.examSessions.userId,
        examId: table.examSessions.examId,
      })
      .from(table.examSessions)
      .where(eq(table.examSessions.id, sessionId))
      .limit(1)
      .then(takeFirst),
    "Session",
  );
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
  return blueprintQuestionIds(exam.blueprint);
}

export async function start(userId: string, examId: string) {
  return db.transaction(async (tx) => {
    // Lock exam row to serialize concurrent session creation for the same exam
    const exam = assertExists(
      await tx
        .select({ id: table.exams.id, isActive: table.exams.isActive })
        .from(table.exams)
        .where(eq(table.exams.id, examId))
        .for("update")
        .limit(1)
        .then(takeFirst),
      "Exam",
    );
    if (!exam.isActive) throw new BadRequestError("Exam is not active");

    const current = await tx
      .select(SESSION_COLUMNS)
      .from(table.examSessions)
      .where(
        and(
          eq(table.examSessions.userId, userId),
          eq(table.examSessions.examId, examId),
          eq(table.examSessions.status, "in_progress"),
        ),
      )
      .limit(1)
      .then(takeFirst);

    if (current) return current;

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
  const found = assertExists(
    await db.query.examSessions.findFirst({
      where: eq(table.examSessions.id, sessionId),
      with: {
        answers: {
          columns: { questionId: true, answer: true },
        },
      },
    }),
    "Session",
  );
  assertAccess(found.userId, actor, "You do not have access to this session");

  const exam = assertExists(
    await db.query.exams.findFirst({
      where: eq(table.exams.id, found.examId),
      columns: { blueprint: true },
    }),
    "Exam",
  );

  const questionIds = [...blueprintQuestionIds(exam.blueprint)];
  const questions =
    questionIds.length > 0
      ? await db.query.questions.findMany({
          where: inArray(table.questions.id, questionIds),
          columns: { id: true, skill: true, part: true, content: true },
        })
      : [];

  const { answers: rawAnswers, ...session } = found;
  return {
    ...session,
    questions,
    answers: rawAnswers.map(({ questionId, answer }) => ({
      questionId,
      answer,
    })),
  };
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

export async function listSessions(userId: string, query: SessionListQuery) {
  const where = and(
    eq(table.examSessions.userId, userId),
    query.status ? eq(table.examSessions.status, query.status) : undefined,
  );
  return paginate(
    db
      .select(SESSION_COLUMNS)
      .from(table.examSessions)
      .where(where)
      .orderBy(desc(table.examSessions.startedAt))
      .$dynamic(),
    db.$count(table.examSessions, where),
    query,
  );
}
