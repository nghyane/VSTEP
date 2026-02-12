import { BadRequestError, ConflictError } from "@common/errors";
import { calculateScore, scoreToBand } from "@common/scoring";
import { assertExists } from "@common/utils";
import { db, table } from "@db/index";
import { ObjectiveAnswer, ObjectiveAnswerKey } from "@db/types/answers";
import { Value } from "@sinclair/typebox/value";
import { eq, sql } from "drizzle-orm";

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
        `Cannot auto-grade a submission with status "${data.status}"`,
      );
    }

    if (data.skill !== "listening" && data.skill !== "reading") {
      throw new BadRequestError(
        "Only listening and reading submissions can be auto-graded",
      );
    }

    if (!data.answerKey) {
      throw new BadRequestError("Question has no answer key for auto-grading");
    }

    if (
      !Value.Check(ObjectiveAnswerKey, data.answerKey) ||
      !Value.Check(ObjectiveAnswer, data.answer)
    ) {
      throw new BadRequestError("Answer format incompatible with auto-grading");
    }

    const { correctCount, totalCount } = data;

    const score = calculateScore(correctCount, totalCount) ?? 0;
    const band = scoreToBand(score);

    const ts = new Date().toISOString();
    const result = { correctCount, totalCount, score, band, gradedAt: ts };

    await tx
      .update(table.submissions)
      .set({
        status: "completed",
        score,
        band,
        completedAt: ts,
        updatedAt: ts,
      })
      .where(eq(table.submissions.id, submissionId));

    await tx
      .update(table.submissionDetails)
      .set({ result })
      .where(eq(table.submissionDetails.submissionId, submissionId));

    return { score, result };
  });
}
