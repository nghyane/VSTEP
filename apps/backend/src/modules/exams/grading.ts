import { BadRequestError } from "@common/errors";
import {
  normalizeAnswer,
  parseAnswerKey,
  parseUserAnswer,
} from "@common/scoring";
import type { DbTransaction } from "@db/index";
import { table } from "@db/index";
import type { ObjectiveAnswerKey, SubmissionAnswer } from "@db/types/answers";
import { and, eq, inArray } from "drizzle-orm";

type AnswerEntry = { questionId: string; answer: SubmissionAnswer };
type QuestionInfo = { skill: string; answerKey: ObjectiveAnswerKey | null };

export function gradeAnswers(
  answers: AnswerEntry[],
  questionsMap: Map<string, QuestionInfo>,
) {
  const acc = {
    listeningCorrect: 0,
    listeningTotal: 0,
    readingCorrect: 0,
    readingTotal: 0,
    writing: [] as AnswerEntry[],
    speaking: [] as AnswerEntry[],
    correctness: new Map<string, boolean>(),
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
    const correct = items.filter(
      ([id, expected]) =>
        normalizeAnswer(ans[id] ?? "") === normalizeAnswer(expected),
    ).length;

    acc.correctness.set(
      ea.questionId,
      items.length > 0 && correct === items.length,
    );

    if (q.skill === "listening") {
      acc.listeningCorrect += correct;
      acc.listeningTotal += items.length;
      continue;
    }
    acc.readingCorrect += correct;
    acc.readingTotal += items.length;
  }

  return acc;
}

export async function persistCorrectness(
  tx: DbTransaction,
  sessionId: string,
  correctness: Map<string, boolean>,
) {
  if (correctness.size === 0) return;

  const entries = [...correctness.entries()];
  const correct = entries
    .filter(([, isCorrect]) => isCorrect)
    .map(([id]) => id);
  const incorrect = entries
    .filter(([, isCorrect]) => !isCorrect)
    .map(([id]) => id);

  if (correct.length > 0) {
    await tx
      .update(table.examAnswers)
      .set({ isCorrect: true })
      .where(
        and(
          eq(table.examAnswers.sessionId, sessionId),
          inArray(table.examAnswers.questionId, correct),
        ),
      );
  }
  if (incorrect.length > 0) {
    await tx
      .update(table.examAnswers)
      .set({ isCorrect: false })
      .where(
        and(
          eq(table.examAnswers.sessionId, sessionId),
          inArray(table.examAnswers.questionId, incorrect),
        ),
      );
  }
}
