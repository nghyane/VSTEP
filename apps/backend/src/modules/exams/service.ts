import { assertAccess, assertExists, now } from "@common/utils";
import { Value } from "@sinclair/typebox/value";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
  sql,
} from "drizzle-orm";
import type { DbTransaction } from "@/db";
import { db, notDeleted, omitColumns, pagination, table } from "@/db";
import {
  ObjectiveAnswer,
  ObjectiveAnswerKey,
} from "@/modules/questions/content-schemas";
import type { Actor } from "@/plugins/auth";
import { BadRequestError } from "@/plugins/error";
import type { ExamCreateBody, ExamListQuery, ExamUpdateBody } from "./model";

function parseAnswerKey(raw: unknown): Record<string, string> {
  if (Value.Check(ObjectiveAnswerKey, raw)) return raw.correctAnswers;
  return {};
}

function parseUserAnswer(raw: unknown): Record<string, string> {
  if (Value.Check(ObjectiveAnswer, raw)) return raw.answers;
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    // Legacy shape: flat { "1": "A", "2": "B" } without wrapper
    const entries = Object.entries(raw as Record<string, unknown>).filter(
      ([, v]) => typeof v === "string",
    );
    if (entries.length > 0) return Object.fromEntries(entries);
  }
  return {};
}

const EXAM_COLUMNS = omitColumns(getTableColumns(table.exams), ["deletedAt"]);
const SESSION_COLUMNS = omitColumns(getTableColumns(table.examSessions), [
  "deletedAt",
]);

/** Derive a { key: true } columns object from SESSION_COLUMNS keys for relational queries */
const SESSION_QUERY_COLUMNS = Object.fromEntries(
  Object.keys(SESSION_COLUMNS).map((k) => [k, true] as const),
) as { [K in keyof typeof SESSION_COLUMNS]: true };

/** Fetch and validate an in-progress session owned by the actor */
async function getActiveSession(
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
  assertAccess(s.userId, actor, "You do not have access to this session");

  if (s.status !== "in_progress") {
    throw new BadRequestError("Session is not in progress");
  }

  return s;
}

export async function getExamById(id: string) {
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

export async function listExams(query: ExamListQuery) {
  const pg = pagination(query.page, query.limit);

  const conditions = [notDeleted(table.exams)];
  if (query.level) conditions.push(eq(table.exams.level, query.level));
  if (query.isActive !== undefined)
    conditions.push(eq(table.exams.isActive, query.isActive));

  const whereClause = and(...conditions);

  const [countResult, exams] = await Promise.all([
    db
      .select({ count: count() })
      .from(table.exams)
      .where(whereClause)
      .then(([row]) => row?.count ?? 0),
    db
      .select(EXAM_COLUMNS)
      .from(table.exams)
      .where(whereClause)
      .orderBy(desc(table.exams.createdAt))
      .limit(pg.limit)
      .offset(pg.offset),
  ]);

  return {
    data: exams,
    meta: pg.meta(countResult),
  };
}

export async function createExam(userId: string, body: ExamCreateBody) {
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

export async function updateExam(id: string, body: ExamUpdateBody) {
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

export async function startExamSession(userId: string, examId: string) {
  return db.transaction(async (tx) => {
    const examRow = await db.query.exams.findFirst({
      where: and(eq(table.exams.id, examId), notDeleted(table.exams)),
      columns: { id: true, isActive: true },
    });

    const exam = assertExists(examRow, "Exam");
    if (!exam.isActive) {
      throw new BadRequestError("Exam is not active");
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
  assertAccess(s.userId, actor, "You do not have access to this session");
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
    throw new BadRequestError("Invalid or inactive question");
  }
}

/** Submit answer inside a transaction to prevent TOCTOU race */
export async function submitExamAnswer(
  sessionId: string,
  body: { questionId: string; answer: unknown },
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
  answers: { questionId: string; answer: unknown }[],
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

/** Auto-grade listening/reading answers against question answerKeys */
export function autoGradeAnswers(
  examAnswers: { questionId: string; answer: unknown }[],
  questionsMap: Map<string, { skill: string; answerKey: unknown }>,
) {
  let listeningCorrect = 0;
  let listeningTotal = 0;
  let readingCorrect = 0;
  let readingTotal = 0;
  const writingAnswers: { questionId: string; answer: unknown }[] = [];
  const speakingAnswers: { questionId: string; answer: unknown }[] = [];
  const correctnessMap = new Map<string, boolean>();

  for (const ea of examAnswers) {
    const question = questionsMap.get(ea.questionId);
    if (!question) {
      throw new BadRequestError(
        `Question ${ea.questionId} not found during grading`,
      );
    }

    const { skill, answerKey } = question;

    if (skill === "listening" || skill === "reading") {
      const correctAnswers = parseAnswerKey(answerKey);
      const userAnswers = parseUserAnswer(ea.answer);

      let qCorrect = 0;
      let qTotal = 0;

      for (const [key, correctValue] of Object.entries(correctAnswers)) {
        const userValue = userAnswers[key];
        const isCorrect =
          userValue != null &&
          userValue.trim().toLowerCase() === correctValue.trim().toLowerCase();

        qTotal++;
        if (isCorrect) qCorrect++;

        if (skill === "listening") {
          listeningTotal++;
          if (isCorrect) listeningCorrect++;
        } else {
          readingTotal++;
          if (isCorrect) readingCorrect++;
        }
      }

      correctnessMap.set(ea.questionId, qTotal > 0 && qCorrect === qTotal);
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
    correctnessMap,
  };
}

/** Calculate score: (correct / total) * 10, rounded to nearest 0.5 */
export function calculateScore(correct: number, total: number): number | null {
  return total === 0 ? null : Math.round((correct / total) * 10 * 2) / 2;
}

/** Calculate overall score: average of all 4 skill scores, rounded to nearest 0.5. Returns null if any score is missing. */
export function calculateOverallScore(
  scores: (number | null)[],
): number | null {
  if (scores.length === 0 || scores.some((s) => s === null)) return null;
  const valid = scores as number[];
  const avg = valid.reduce((sum, s) => sum + s, 0) / valid.length;
  return Math.round(avg * 2) / 2;
}

/** Fetch all exam answers for a session */
async function fetchSessionAnswers(tx: DbTransaction, sessionId: string) {
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
  return answers;
}

/** Batch-fetch questions for a list of question IDs */
async function fetchQuestionsForAnswers(
  tx: DbTransaction,
  questionIds: string[],
) {
  const rows = await tx
    .select({
      id: table.questions.id,
      skill: table.questions.skill,
      answerKey: table.questions.answerKey,
    })
    .from(table.questions)
    .where(inArray(table.questions.id, questionIds));

  return new Map(
    rows.map((q) => [q.id, { skill: q.skill, answerKey: q.answerKey }]),
  );
}

/** Persist isCorrect flags on objective answers */
async function persistCorrectness(
  tx: DbTransaction,
  sessionId: string,
  correctnessMap: Map<string, boolean>,
) {
  if (correctnessMap.size === 0) return;

  const correctIds: string[] = [];
  const incorrectIds: string[] = [];
  for (const [qId, correct] of correctnessMap) {
    if (correct) correctIds.push(qId);
    else incorrectIds.push(qId);
  }
  if (correctIds.length > 0) {
    await tx
      .update(table.examAnswers)
      .set({ isCorrect: true })
      .where(
        and(
          eq(table.examAnswers.sessionId, sessionId),
          inArray(table.examAnswers.questionId, correctIds),
        ),
      );
  }
  if (incorrectIds.length > 0) {
    await tx
      .update(table.examAnswers)
      .set({ isCorrect: false })
      .where(
        and(
          eq(table.examAnswers.sessionId, sessionId),
          inArray(table.examAnswers.questionId, incorrectIds),
        ),
      );
  }
}

/** Batch-create pending submissions for writing/speaking answers */
async function createPendingSubmissions(
  tx: DbTransaction,
  sessionId: string,
  userId: string,
  pendingAnswers: {
    questionId: string;
    answer: unknown;
    skill: "writing" | "speaking";
  }[],
) {
  if (pendingAnswers.length === 0) return;

  const insertedSubmissions = await tx
    .insert(table.submissions)
    .values(
      pendingAnswers.map((a) => ({
        userId,
        questionId: a.questionId,
        skill: a.skill,
        status: "pending" as const,
      })),
    )
    .returning({ id: table.submissions.id });

  await tx.insert(table.submissionDetails).values(
    insertedSubmissions.map((sub, i) => ({
      submissionId: sub.id,
      answer: pendingAnswers[i].answer,
    })),
  );

  await tx.insert(table.examSubmissions).values(
    insertedSubmissions.map((sub, i) => ({
      sessionId,
      submissionId: sub.id,
      skill: pendingAnswers[i].skill,
    })),
  );
}

/** Finalize session: set scores, status, and completedAt */
async function finalizeSession(
  tx: DbTransaction,
  sessionId: string,
  scores: { listeningScore: number | null; readingScore: number | null },
  status: string,
) {
  const timestamp = now();
  const [updatedSession] = await tx
    .update(table.examSessions)
    .set({
      listeningScore: scores.listeningScore,
      readingScore: scores.readingScore,
      status,
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
}

/** Submit exam: auto-grade listening/reading, create submissions for writing/speaking */
export async function submitExam(sessionId: string, actor: Actor) {
  return db.transaction(async (tx) => {
    const session = await getActiveSession(tx, sessionId, actor);
    const answers = await fetchSessionAnswers(tx, sessionId);

    const questionIds = answers.map((a) => a.questionId);
    const questionsMap = await fetchQuestionsForAnswers(tx, questionIds);

    const gradeResult = autoGradeAnswers(answers, questionsMap);

    await persistCorrectness(tx, sessionId, gradeResult.correctnessMap);

    const listeningScore = calculateScore(
      gradeResult.listeningCorrect,
      gradeResult.listeningTotal,
    );
    const readingScore = calculateScore(
      gradeResult.readingCorrect,
      gradeResult.readingTotal,
    );

    const pendingAnswers = [
      ...gradeResult.writingAnswers.map((a) => ({
        ...a,
        skill: "writing" as const,
      })),
      ...gradeResult.speakingAnswers.map((a) => ({
        ...a,
        skill: "speaking" as const,
      })),
    ];

    await createPendingSubmissions(
      tx,
      sessionId,
      session.userId,
      pendingAnswers,
    );

    const finalStatus = pendingAnswers.length > 0 ? "submitted" : "completed";
    return finalizeSession(
      tx,
      sessionId,
      { listeningScore, readingScore },
      finalStatus,
    );
  });
}

/** Recompute overallScore when a submission is graded. Called after writing/speaking grading completes. */
export async function updateSessionScoreIfComplete(sessionId: string) {
  return db.transaction(async (tx) => {
    const [session] = await tx
      .select({
        id: table.examSessions.id,
        status: table.examSessions.status,
        listeningScore: table.examSessions.listeningScore,
        readingScore: table.examSessions.readingScore,
        writingScore: table.examSessions.writingScore,
        speakingScore: table.examSessions.speakingScore,
      })
      .from(table.examSessions)
      .where(
        and(
          eq(table.examSessions.id, sessionId),
          notDeleted(table.examSessions),
        ),
      )
      .limit(1);

    if (!session || session.status === "completed") return null;

    // Check if all exam_submissions are completed
    const pendingSubmissions = await tx
      .select({ id: table.examSubmissions.id })
      .from(table.examSubmissions)
      .innerJoin(
        table.submissions,
        eq(table.examSubmissions.submissionId, table.submissions.id),
      )
      .where(
        and(
          eq(table.examSubmissions.sessionId, sessionId),
          sql`${table.submissions.status} != 'completed'`,
        ),
      )
      .limit(1);

    if (pendingSubmissions.length > 0) return null;

    // Fetch actual writing/speaking scores from completed submissions
    const skillScores = await tx
      .select({
        skill: table.examSubmissions.skill,
        score: table.submissions.score,
      })
      .from(table.examSubmissions)
      .innerJoin(
        table.submissions,
        eq(table.examSubmissions.submissionId, table.submissions.id),
      )
      .where(eq(table.examSubmissions.sessionId, sessionId));

    let writingScore = session.writingScore;
    let speakingScore = session.speakingScore;
    for (const row of skillScores) {
      if (row.skill === "writing" && row.score !== null)
        writingScore = row.score;
      if (row.skill === "speaking" && row.score !== null)
        speakingScore = row.score;
    }

    const overallScore = calculateOverallScore([
      session.listeningScore,
      session.readingScore,
      writingScore,
      speakingScore,
    ]);

    const timestamp = now();
    const [updated] = await tx
      .update(table.examSessions)
      .set({
        writingScore,
        speakingScore,
        overallScore,
        status: overallScore !== null ? "completed" : session.status,
        completedAt: overallScore !== null ? timestamp : undefined,
        updatedAt: timestamp,
      })
      .where(eq(table.examSessions.id, sessionId))
      .returning(SESSION_COLUMNS);

    return updated ?? null;
  });
}
