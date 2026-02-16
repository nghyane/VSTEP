import { BadRequestError, ConflictError } from "@common/errors";
import { normalizeAnswer, scoreToBand } from "@common/scoring";
import { assertExists } from "@common/utils";
import type { UserProgress } from "@db/index";
import { db, table } from "@db/index";
import { ObjectiveAnswer, ObjectiveAnswerKey } from "@db/types/answers";
import { Value } from "@sinclair/typebox/value";
import { eq } from "drizzle-orm";
import { record, sync } from "@/modules/progress/service";

export async function autoGrade(submissionId: string) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        id: table.submissions.id,
        userId: table.submissions.userId,
        status: table.submissions.status,
        skill: table.submissions.skill,
        answerKey: table.questions.answerKey,
        answer: table.submissionDetails.answer,
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

    // Grade in application code — SQL jsonb extraction fails on double-encoded JSONB
    const expected = data.answerKey.correctAnswers;
    const given = data.answer.answers;
    const entries = Object.entries(expected);
    const totalCount = entries.length;

    if (totalCount === 0)
      throw new BadRequestError("Question has no answer items to grade");

    const correctCount = entries.filter(
      ([id, exp]) => normalizeAnswer(given[id] ?? "") === normalizeAnswer(exp),
    ).length;

    const ratio = Math.min(correctCount / totalCount, 1);
    const score = Math.round(ratio * 10 * 2) / 2;
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

    const skill = data.skill as UserProgress["skill"];
    await record(data.userId, skill, submissionId, score, tx);
    await sync(data.userId, skill, tx);

    return { score, result };
  });
}
