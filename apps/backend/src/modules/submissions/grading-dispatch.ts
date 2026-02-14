import { logger } from "@common/logger";
import type { DbTransaction } from "@db/index";
import { table } from "@db/index";
import { redis } from "bun";
import { eq } from "drizzle-orm";

const GRADING_QUEUE = "grading:tasks";

/** Push W/S submission to Redis queue for AI grading, set status to processing. */
export async function dispatchGrading(
  tx: DbTransaction,
  submissionId: string,
  skill: string,
  questionId: string,
  answer: unknown,
) {
  const ts = new Date().toISOString();

  await redis.send("LPUSH", [
    GRADING_QUEUE,
    JSON.stringify({
      submissionId,
      questionId,
      skill,
      answer,
      dispatchedAt: ts,
    }),
  ]);

  await tx
    .update(table.submissions)
    .set({ status: "processing", updatedAt: ts })
    .where(eq(table.submissions.id, submissionId));

  logger.info("Dispatched grading task", { submissionId, skill });
}
