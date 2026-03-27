import { BadRequestError } from "@common/errors";
import {
  normalizeAnswer,
  parseAnswerKey,
  parseUserAnswer,
} from "@common/scoring";
import type { DbTransaction } from "@db/index";
import { table } from "@db/index";
import type { Skill } from "@db/schema/enums";
import type { ObjectiveAnswerKey, SubmissionAnswer } from "@db/types/answers";
import { and, eq, inArray } from "drizzle-orm";

export type AnswerEntry = { questionId: string; answer: SubmissionAnswer };
export type QuestionInfo = {
  skill: Skill;
  answerKey: ObjectiveAnswerKey | null;
};

interface SkillTally {
  correct: number;
  total: number;
}

export interface Tally {
  listening: SkillTally;
  reading: SkillTally;
  subjective: (AnswerEntry & { skill: Skill })[];
  correctness: Map<string, boolean>;
}

export function gradeAnswers(
  answers: AnswerEntry[],
  questionsMap: Map<string, QuestionInfo>,
): Tally {
  const listening: SkillTally = { correct: 0, total: 0 };
  const reading: SkillTally = { correct: 0, total: 0 };
  const subjective: Tally["subjective"] = [];
  const correctness = new Map<string, boolean>();

  for (const ea of answers) {
    const q = questionsMap.get(ea.questionId);
    if (!q)
      throw new BadRequestError(
        `Question ${ea.questionId} not found during grading`,
      );

    if (q.skill === "writing" || q.skill === "speaking") {
      subjective.push({ ...ea, skill: q.skill });
      continue;
    }

    const key = parseAnswerKey(q.answerKey);
    const ans = parseUserAnswer(ea.answer);
    const items = Object.entries(key);
    const correct = items.filter(
      ([id, expected]) =>
        normalizeAnswer(ans[id] ?? "") === normalizeAnswer(expected),
    ).length;

    correctness.set(
      ea.questionId,
      items.length > 0 && correct === items.length,
    );

    const tally = q.skill === "listening" ? listening : reading;
    tally.correct += correct;
    tally.total += items.length;
  }

  return { listening, reading, subjective, correctness };
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
