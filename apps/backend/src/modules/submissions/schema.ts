import { Skill, SubmissionStatus, VstepBand } from "@db/enums";
import { omitColumns } from "@db/index";
import { submissions } from "@db/schema";
import { SubmissionAnswer } from "@db/types/answers";
import { GradingResult } from "@db/types/grading";
import { getTableColumns } from "drizzle-orm";
import { createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";

const OMITTED = [
  "reviewPriority",
  "reviewerId",
  "gradingMode",
  "auditFlag",
  "claimedBy",
  "claimedAt",
] as const;

export const SUBMISSION_COLUMNS = omitColumns(
  getTableColumns(submissions),
  OMITTED,
);

const QUEUE_OMITTED = ["gradingMode", "auditFlag"] as const;

/** Includes review-specific columns (claimedBy, claimedAt, reviewPriority, reviewerId) */
export const REVIEW_QUEUE_COLUMNS = omitColumns(
  getTableColumns(submissions),
  QUEUE_OMITTED,
);

/** For db.query.* — Drizzle columns exclusion pattern */
export const SUBMISSION_EXCLUDE = Object.fromEntries(
  OMITTED.map((k) => [k, false] as const),
) as { [K in (typeof OMITTED)[number]]: false };

const SubmissionRow = createSelectSchema(submissions);

export const Submission = t.Omit(SubmissionRow, [...OMITTED]);
export type Submission = typeof Submission.static;

export const SubmissionFull = t.Composite([
  Submission,
  t.Object({
    answer: t.Nullable(SubmissionAnswer),
    result: t.Nullable(GradingResult),
    feedback: t.Nullable(t.String({ maxLength: 10000 })),
  }),
]);
export type SubmissionFull = typeof SubmissionFull.static;

export const SubmissionCreateBody = t.Object({
  questionId: t.String({ format: "uuid" }),
  answer: SubmissionAnswer,
});

export const SubmissionUpdateBody = t.Partial(
  t.Object({
    answer: SubmissionAnswer,
    status: SubmissionStatus,
    score: t.Number({ minimum: 0, maximum: 10, multipleOf: 0.5 }),
    band: VstepBand,
    feedback: t.String({ minLength: 1, maxLength: 10000 }),
  }),
);

export const SubmissionGradeBody = t.Object({
  score: t.Number({ minimum: 0, maximum: 10, multipleOf: 0.5 }),
  band: t.Optional(VstepBand),
  feedback: t.Optional(t.String({ minLength: 1, maxLength: 10000 })),
});

export const SubmissionListQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  skill: t.Optional(Skill),
  status: t.Optional(SubmissionStatus),
  userId: t.Optional(t.String({ format: "uuid" })),
});

export const ReviewQueueQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  skill: t.Optional(Skill),
  priority: t.Optional(t.UnionEnum(["low", "medium", "high"])),
});

export const SubmissionReviewBody = t.Object({
  overallScore: t.Number({ minimum: 0, maximum: 10, multipleOf: 0.5 }),
  band: t.Optional(VstepBand),
  criteriaScores: t.Optional(t.Record(t.String(), t.Any())),
  feedback: t.Optional(t.String({ minLength: 1, maxLength: 10000 })),
  reviewComment: t.Optional(t.String({ maxLength: 5000 })),
});

export const SubmissionAssignBody = t.Object({
  reviewerId: t.String({ format: "uuid" }),
});

export const ReviewQueueItem = t.Composite([
  Submission,
  t.Object({
    claimedBy: t.Nullable(t.String({ format: "uuid" })),
    claimedAt: t.Nullable(t.String({ format: "date-time" })),
    reviewPriority: t.Nullable(t.UnionEnum(["low", "medium", "high"])),
    reviewerId: t.Nullable(t.String({ format: "uuid" })),
  }),
]);

export type SubmissionCreateBody = typeof SubmissionCreateBody.static;
export type SubmissionUpdateBody = typeof SubmissionUpdateBody.static;
export type SubmissionGradeBody = typeof SubmissionGradeBody.static;
export type SubmissionListQuery = typeof SubmissionListQuery.static;
export type ReviewQueueQuery = typeof ReviewQueueQuery.static;
export type SubmissionReviewBody = typeof SubmissionReviewBody.static;
export type SubmissionAssignBody = typeof SubmissionAssignBody.static;
export type ReviewQueueItem = typeof ReviewQueueItem.static;
