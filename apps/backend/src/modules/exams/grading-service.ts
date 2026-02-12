import type { Actor } from "@common/auth-types";
import { BadRequestError } from "@common/errors";
import { calculateScore } from "@common/scoring";
import { assertExists } from "@common/utils";
import type { DbTransaction } from "@db/index";
import { db, notDeleted, table } from "@db/index";
import type { ObjectiveAnswerKey, SubmissionAnswer } from "@db/types/answers";
import {
  ObjectiveAnswer,
  ObjectiveAnswerKey as ObjectiveAnswerKeySchema,
} from "@db/types/answers";
import { Value } from "@sinclair/typebox/value";
import { and, eq, inArray } from "drizzle-orm";
import { SESSION_COLUMNS } from "./schema";
import type { ExamSessionStatus } from "./service";
import { getActiveSession } from "./session-service";

function parseAnswerKey(raw: unknown): Record<string, string> {
  if (Value.Check(ObjectiveAnswerKeySchema, raw)) return raw.correctAnswers;
  return {};
}

function parseUserAnswer(raw: unknown): Record<string, string> {
  if (Value.Check(ObjectiveAnswer, raw)) return raw.answers;
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    const entries = Object.entries(raw as Record<string, unknown>).filter(
      ([, v]) => typeof v === "string",
    );
    if (entries.length > 0)
      return Object.fromEntries(entries) as Record<string, string>;
  }
  return {};
}

type AnswerEntry = { questionId: string; answer: SubmissionAnswer };
type QuestionInfo = { skill: string; answerKey: ObjectiveAnswerKey | null };

export function autoGradeAnswers(
  answers: AnswerEntry[],
  questionsMap: Map<string, QuestionInfo>,
) {
  const acc = {
    lOk: 0,
    lTot: 0,
    rOk: 0,
    rTot: 0,
    writing: [] as AnswerEntry[],
    speaking: [] as AnswerEntry[],
    map: new Map<string, boolean>(),
  };

  for (const ea of answers) {
    const q = questionsMap.get(ea.questionId);
    if (!q)
      throw new BadRequestError(
        `Question ${ea.questionId} not found during grading`,
      );

    if (q.skill === "writing") {
      acc.writing.push(ea);
      continue;
    }
    if (q.skill === "speaking") {
      acc.speaking.push(ea);
      continue;
    }

    const key = parseAnswerKey(q.answerKey);
    const ans = parseUserAnswer(ea.answer);
    const items = Object.entries(key);
    const ok = items.filter(
      ([k, v]) => ans[k]?.trim().toLowerCase() === v.trim().toLowerCase(),
    ).length;

    acc.map.set(ea.questionId, items.length > 0 && ok === items.length);

    if (q.skill === "listening") {
      acc.lOk += ok;
      acc.lTot += items.length;
    } else {
      acc.rOk += ok;
      acc.rTot += items.length;
    }
  }

  return acc;
}

async function persistCorrectness(
  tx: DbTransaction,
  sessionId: string,
  correctness: Map<string, boolean>,
) {
  if (correctness.size === 0) return;

  const entries = [...correctness.entries()];
  const ok = entries.filter(([, v]) => v).map(([k]) => k);
  const bad = entries.filter(([, v]) => !v).map(([k]) => k);

  if (ok.length > 0) {
    await tx
      .update(table.examAnswers)
      .set({ isCorrect: true })
      .where(
        and(
          eq(table.examAnswers.sessionId, sessionId),
          inArray(table.examAnswers.questionId, ok),
        ),
      );
  }
  if (bad.length > 0) {
    await tx
      .update(table.examAnswers)
      .set({ isCorrect: false })
      .where(
        and(
          eq(table.examAnswers.sessionId, sessionId),
          inArray(table.examAnswers.questionId, bad),
        ),
      );
  }
}

export async function submitExam(sessionId: string, actor: Actor) {
  return db.transaction(async (tx) => {
    const session = await getActiveSession(tx, sessionId, actor);

    const answers = await tx
      .select({
        questionId: table.examAnswers.questionId,
        answer: table.examAnswers.answer,
      })
      .from(table.examAnswers)
      .where(eq(table.examAnswers.sessionId, sessionId));

    if (answers.length === 0)
      throw new BadRequestError("No answers found for this session");

    const questionIds = answers.map((a) => a.questionId);
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

    const questionsMap = new Map(
      rows.map((q) => [q.id, { skill: q.skill, answerKey: q.answerKey }]),
    );

    const grade = autoGradeAnswers(answers, questionsMap);

    await persistCorrectness(tx, sessionId, grade.map);

    const listeningScore = calculateScore(grade.lOk, grade.lTot);
    const readingScore = calculateScore(grade.rOk, grade.rTot);

    const pending = [
      ...grade.writing.map((a) => ({ ...a, skill: "writing" as const })),
      ...grade.speaking.map((a) => ({ ...a, skill: "speaking" as const })),
    ];

    if (pending.length > 0) {
      const inserted = await tx
        .insert(table.submissions)
        .values(
          pending.map((a) => ({
            userId: session.userId,
            questionId: a.questionId,
            skill: a.skill,
            status: "pending" as const,
          })),
        )
        .returning({ id: table.submissions.id });

      await tx.insert(table.submissionDetails).values(
        inserted.map((sub, i) => ({
          submissionId: sub.id,
          answer: assertExists(pending[i], "Pending answer").answer,
        })),
      );

      await tx.insert(table.examSubmissions).values(
        inserted.map((sub, i) => ({
          sessionId,
          submissionId: sub.id,
          skill: assertExists(pending[i], "Pending answer").skill,
        })),
      );

      await tx.insert(table.outbox).values(
        inserted.map((sub, i) => ({
          submissionId: sub.id,
          messageType: "submission.pending_review",
          payload: {
            sessionId,
            skill: assertExists(pending[i], "Pending answer").skill,
            userId: session.userId,
          },
        })),
      );
    }

    const ts = new Date().toISOString();
    const status: ExamSessionStatus =
      pending.length > 0 ? "submitted" : "completed";
    const [updated] = await tx
      .update(table.examSessions)
      .set({
        listeningScore,
        readingScore,
        status,
        completedAt: ts,
        updatedAt: ts,
      })
      .where(
        and(
          eq(table.examSessions.id, sessionId),
          eq(table.examSessions.status, "in_progress"),
        ),
      )
      .returning(SESSION_COLUMNS);

    return assertExists(updated, "Session");
  });
}
