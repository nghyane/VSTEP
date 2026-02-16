import { BadRequestError, ConflictError } from "@common/errors";
import { scoreToBand } from "@common/scoring";
import { db, table, takeFirst } from "@db/index";
import { and, eq, inArray } from "drizzle-orm";
import { record, sync } from "@/modules/progress/service";
import type { SubmissionGradeBody } from "./schema";
import { SUBMISSION_COLUMNS } from "./schema";
import { details, GRADABLE_STATUSES } from "./shared";

export async function grade(submissionId: string, body: SubmissionGradeBody) {
  return db.transaction(async (tx) => {
    if (body.score === undefined || body.score === null) {
      throw new BadRequestError("Score is required for grading");
    }

    const ts = new Date().toISOString();
    const updated = await tx
      .update(table.submissions)
      .set({
        status: "completed",
        score: body.score,
        band: body.band ?? scoreToBand(body.score),
        updatedAt: ts,
        completedAt: ts,
      })
      .where(
        and(
          eq(table.submissions.id, submissionId),
          inArray(table.submissions.status, GRADABLE_STATUSES),
        ),
      )
      .returning(SUBMISSION_COLUMNS)
      .then(takeFirst);

    if (!updated) {
      throw new ConflictError(
        "Submission is already graded or in a non-gradable state",
      );
    }

    if (body.feedback) {
      await tx
        .update(table.submissionDetails)
        .set({ feedback: body.feedback })
        .where(eq(table.submissionDetails.submissionId, submissionId));
    }

    await record(updated.userId, updated.skill, submissionId, body.score, tx);
    await sync(updated.userId, updated.skill, tx);

    return {
      ...updated,
      ...(await details(tx, submissionId)),
    };
  });
}
