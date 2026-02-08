import {
  Skill,
  SubmissionStatus as SubmissionStatusEnum,
  VstepBand,
} from "@common/enums";
import { t } from "elysia";
import {
  GradingResult,
  SubmissionAnswer,
} from "@/modules/questions/content-schemas";

export namespace SubmissionModel {
  export const Submission = t.Object({
    id: t.String({ format: "uuid" }),
    userId: t.String({ format: "uuid" }),
    questionId: t.String({ format: "uuid" }),
    skill: Skill,
    status: SubmissionStatusEnum,
    score: t.Optional(t.Nullable(t.Number({ minimum: 0, maximum: 10 }))),
    band: t.Optional(t.Nullable(VstepBand)),
    completedAt: t.Optional(t.String({ format: "date-time" })),
    createdAt: t.String({ format: "date-time" }),
    updatedAt: t.String({ format: "date-time" }),
  });

  export const SubmissionWithDetails = t.Object({
    ...Submission.properties,
    answer: t.Optional(t.Nullable(SubmissionAnswer)),
    result: t.Optional(t.Nullable(GradingResult)),
    feedback: t.Optional(t.Nullable(t.String({ maxLength: 10000 }))),
  });

  export const CreateBody = t.Object({
    questionId: t.String({ format: "uuid" }),
    answer: SubmissionAnswer,
  });

  export const UpdateBody = t.Partial(
    t.Object({
      answer: SubmissionAnswer,
      status: SubmissionStatusEnum,
      score: t.Number({ minimum: 0, maximum: 10 }),
      band: VstepBand,
      feedback: t.String({ maxLength: 10000 }),
    }),
  );

  export const GradeBody = t.Object({
    score: t.Number({ minimum: 0, maximum: 10 }),
    band: t.Optional(VstepBand),
    feedback: t.Optional(t.String({ maxLength: 10000 })),
  });

  export type Submission = typeof Submission.static;
  export type SubmissionWithDetails = typeof SubmissionWithDetails.static;
  export type CreateBody = typeof CreateBody.static;
  export type UpdateBody = typeof UpdateBody.static;
}
