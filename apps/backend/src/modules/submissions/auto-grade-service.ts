import { BadRequestError, ConflictError } from "@common/errors";
import { assertExists, now } from "@common/utils";
import { db, table } from "@db/index";
import { ObjectiveAnswer, ObjectiveAnswerKey } from "@db/types/answers";
import { Value } from "@sinclair/typebox/value";
import { eq, sql } from "drizzle-orm";
import { SUBMISSION_MESSAGES } from "./messages";
import { scoreToBand } from "./scoring";

export async function autoGradeSubmission(submissionId: string) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        id: table.submissions.id,
        status: table.submissions.status,
        skill: table.submissions.skill,
        answerKey: table.questions.answerKey,
        answer: table.submissionDetails.answer,
        correctCount: sql<number>`(
            SELECT count(*)
            FROM jsonb_each_text(${table.questions.answerKey} -> 'correctAnswers') ak
            JOIN jsonb_each_text(${table.submissionDetails.answer} -> 'answers') ua
              ON ak.key = ua.key
            WHERE lower(trim(ua.value)) = lower(trim(ak.value))
          )::int`,
        totalCount: sql<number>`(
            SELECT count(*)
            FROM jsonb_each_text(${table.questions.answerKey} -> 'correctAnswers')
          )::int`,
      })
      .from(table.submissions)
      .innerJoin(
        table.submissionDetails,
        eq(table.submissions.id, table.submissionDetails.submissionId),
      )
      .innerJoin(
        table.questions,
        eq(table.submissions.questionId, table.questions.id),
      )
      .where(eq(table.submissions.id, submissionId))
      .limit(1);

    const data = assertExists(row, "Submission");

    if (["completed", "failed", "review_pending"].includes(data.status)) {
      throw new ConflictError(
        SUBMISSION_MESSAGES.cannotAutoGradeStatus(data.status),
      );
    }

    if (data.skill !== "listening" && data.skill !== "reading") {
      throw new BadRequestError(SUBMISSION_MESSAGES.objectiveOnlyAutoGrading);
    }

    if (!data.answerKey) {
      throw new BadRequestError(SUBMISSION_MESSAGES.noAnswerKeyForAutoGrading);
    }

    if (
      !Value.Check(ObjectiveAnswerKey, data.answerKey) ||
      !Value.Check(ObjectiveAnswer, data.answer)
    ) {
      throw new BadRequestError(SUBMISSION_MESSAGES.incompatibleAnswerFormat);
    }

    const { correctCount, totalCount } = data;

    const rawScore = totalCount > 0 ? (correctCount / totalCount) * 10 : 0;
    const score = Math.round(rawScore * 2) / 2;
    const band = scoreToBand(score);

    const timestamp = now();
    const result = {
      correctCount,
      totalCount,
      score,
      band,
      gradedAt: timestamp,
    };

    await tx
      .update(table.submissions)
      .set({
        status: "completed",
        score,
        band,
        completedAt: timestamp,
        updatedAt: timestamp,
      })
      .where(eq(table.submissions.id, submissionId));

    await tx
      .update(table.submissionDetails)
      .set({ result })
      .where(eq(table.submissionDetails.submissionId, submissionId));

    return { score, result };
  });
}
