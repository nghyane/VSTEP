import { createStateMachine } from "@common/state-machine";
import type { DbTransaction } from "@db/index";
import { table } from "@db/index";
import type { submissionStatusEnum } from "@db/schema/submissions";
import { eq } from "drizzle-orm";

export const DETAIL_COLUMNS = {
  answer: table.submissionDetails.answer,
  result: table.submissionDetails.result,
  feedback: table.submissionDetails.feedback,
};

export type SubmissionStatus = (typeof submissionStatusEnum.enumValues)[number];

const REVIEW_PENDING = "review_pending" satisfies SubmissionStatus;

export const submissionMachine = createStateMachine<SubmissionStatus>({
  pending: ["processing", "failed"],
  processing: ["completed", REVIEW_PENDING, "failed"],
  [REVIEW_PENDING]: ["completed"],
  completed: [],
  failed: [],
});

export const MUTABLE_STATUSES: SubmissionStatus[] = ["pending"];
export const GRADABLE_STATUSES: SubmissionStatus[] = [
  "pending",
  "review_pending",
  "processing",
];

export async function details(tx: DbTransaction, submissionId: string) {
  const [row] = await tx
    .select(DETAIL_COLUMNS)
    .from(table.submissionDetails)
    .where(eq(table.submissionDetails.submissionId, submissionId))
    .limit(1);

  return {
    answer: row?.answer ?? null,
    result: row?.result ?? null,
    feedback: row?.feedback ?? null,
  };
}
