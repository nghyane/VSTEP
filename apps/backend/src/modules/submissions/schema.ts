import { PaginationQuery, SkillFilter } from "@common/schemas";
import { SubmissionStatus as SubmissionStatusEnum, VstepBand } from "@db/enums";
import { SubmissionAnswer } from "@db/types/answers";
import { GradingResult } from "@db/types/grading";
import { submissionView } from "@db/views";
import { t } from "elysia";

export const Submission = submissionView.schema;
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
    status: SubmissionStatusEnum,
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

export const SubmissionListQuery = t.Composite([
  PaginationQuery,
  SkillFilter,
  t.Object({
    status: t.Optional(SubmissionStatusEnum),
    userId: t.Optional(t.String({ format: "uuid" })),
  }),
]);

export type SubmissionCreateBody = typeof SubmissionCreateBody.static;
export type SubmissionUpdateBody = typeof SubmissionUpdateBody.static;
export type SubmissionGradeBody = typeof SubmissionGradeBody.static;
export type SubmissionListQuery = typeof SubmissionListQuery.static;
