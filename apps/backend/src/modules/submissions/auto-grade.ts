import { BadRequestError, ConflictError } from "@common/errors";
import { normalizeAnswer, scoreToBand } from "@common/scoring";
import { assertExists } from "@common/utils";
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

    const submission = assertExists(row, "Submission");

    if (["completed", "failed", "review_pending"].includes(submission.status)) {
      throw new ConflictError(
        `Cannot auto-grade a submission with status "${submission.status}"`,
      );
    }

    if (submission.skill !== "listening" && submission.skill !== "reading") {
      throw new BadRequestError(
        "Only listening and reading submissions can be auto-graded",
      );
    }

    if (!submission.answerKey) {
      throw new BadRequestError("Question has no answer key for auto-grading");
    }

    if (
      !Value.Check(ObjectiveAnswerKey, submission.answerKey) ||
      !Value.Check(ObjectiveAnswer, submission.answer)
    ) {
      throw new BadRequestError("Answer format incompatible with auto-grading");
    }

    // Grade in application code — SQL jsonb extraction fails on double-encoded JSONB
    const expected = submission.answerKey.correctAnswers;
    const given = submission.answer.answers;
    const entries = Object.entries(expected);
    const totalCount = entries.length;

    if (totalCount === 0)
      throw new BadRequestError("Question has no answer items to grade");

    const correctCount = entries.filter(
      ([id, exp]) => normalizeAnswer(given[id] ?? "") === normalizeAnswer(exp),
    ).length;

    const ratio = Math.min(correctCount / totalCount, 1);
    const score = Math.round(ratio * 10 * 2) / 2;
    const band = scoreToBand(score) ?? undefined;

    const ts = new Date().toISOString();
    const result = {
      type: "auto" as const,
      correctCount,
      totalCount,
      score,
      band,
      gradedAt: ts,
    };

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

    await Promise.all([
      record(submission.userId, submission.skill, submissionId, score, tx),
      sync(submission.userId, submission.skill, tx),
    ]);

    return { score, result };
  });
}
