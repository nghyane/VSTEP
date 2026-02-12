import type { Actor } from "@common/auth-types";
import { BadRequestError } from "@common/errors";
import { assertExists, now } from "@common/utils";
import type { DbTransaction } from "@db/index";
import { db, notDeleted, table } from "@db/index";
import type { ObjectiveAnswerKey, SubmissionAnswer } from "@db/types/answers";
import {
  ObjectiveAnswer,
  ObjectiveAnswerKey as ObjectiveAnswerKeySchema,
} from "@db/types/answers";
import { sessionView } from "@db/views";
import { Value } from "@sinclair/typebox/value";
import { and, eq, inArray } from "drizzle-orm";
import { EXAM_MESSAGES } from "./messages";
import { calculateOverallScore, calculateScore } from "./scoring";
import type { ExamSessionStatus } from "./service";
import { getActiveSession } from "./session-service";

function parseAnswerKey(raw: unknown): Record<string, string> {
  if (Value.Check(ObjectiveAnswerKeySchema, raw)) return raw.correctAnswers;
  return {};
}

function parseUserAnswer(raw: unknown): Record<string, string> {
  if (Value.Check(ObjectiveAnswer, raw)) return raw.answers;
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    // Legacy shape: flat { "1": "A", "2": "B" } without wrapper
    const entries = Object.entries(raw as Record<string, unknown>).filter(
      ([, v]) => typeof v === "string",
    );
    if (entries.length > 0)
      return Object.fromEntries(entries) as Record<string, string>;
  }
  return {};
}

/**
 * Auto-grade objective (listening/reading) answers by normalized per-item string comparison.
 * Writing and speaking answers are collected for manual grading workflows.
 */
export function autoGradeAnswers(
  examAnswers: { questionId: string; answer: SubmissionAnswer }[],
  questionsMap: Map<
    string,
    { skill: string; answerKey: ObjectiveAnswerKey | null }
  >,
) {
  let listeningCorrect = 0;
  let listeningTotal = 0;
  let readingCorrect = 0;
  let readingTotal = 0;
  const writingAnswers: { questionId: string; answer: SubmissionAnswer }[] = [];
  const speakingAnswers: { questionId: string; answer: SubmissionAnswer }[] =
    [];
  const correctnessMap = new Map<string, boolean>();

  for (const ea of examAnswers) {
    const question = questionsMap.get(ea.questionId);
    if (!question) {
      throw new BadRequestError(
        EXAM_MESSAGES.questionNotFoundDuringGrading(ea.questionId),
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

/**
 * calculateScore: (correct / total) * 10 rounded to nearest 0.5.
 * calculateOverallScore: average of all skill scores rounded to nearest 0.5, null if any is missing.
 */
export { calculateOverallScore, calculateScore };

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
    throw new BadRequestError(EXAM_MESSAGES.noAnswers);
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
    .where(
      and(
        inArray(table.questions.id, questionIds),
        notDeleted(table.questions),
      ),
    );

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
    answer: SubmissionAnswer;
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
    insertedSubmissions.map((sub, i) => {
      const pending = assertExists(pendingAnswers[i], "Pending answer");
      return {
        submissionId: sub.id,
        answer: pending.answer,
      };
    }),
  );

  await tx.insert(table.examSubmissions).values(
    insertedSubmissions.map((sub, i) => {
      const pending = assertExists(pendingAnswers[i], "Pending answer");
      return {
        sessionId,
        submissionId: sub.id,
        skill: pending.skill,
      };
    }),
  );
}

/** Finalize session: set scores, status, and completedAt */
async function finalizeSession(
  tx: DbTransaction,
  sessionId: string,
  scores: { listeningScore: number | null; readingScore: number | null },
  status: ExamSessionStatus,
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
    .returning(sessionView.columns);

  return assertExists(updatedSession, "Session");
}

/**
 * Submit an in-progress exam session by orchestrating objective grading, correctness persistence,
 * pending writing/speaking submission creation, and final session status/score update.
 */
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
