import {
  Skill,
  SubmissionStatus as SubmissionStatusEnum,
  VstepBand,
} from "@common/enums";
import { t } from "elysia";

export namespace SubmissionModel {
  export const Submission = t.Object({
    id: t.String({ format: "uuid" }),
    userId: t.String({ format: "uuid" }),
    questionId: t.String({ format: "uuid" }),
    skill: Skill,
    status: SubmissionStatusEnum,
    score: t.Optional(t.Nullable(t.Number())),
    band: t.Optional(t.Nullable(VstepBand)),
    completedAt: t.Optional(t.String({ format: "date-time" })),
    createdAt: t.String({ format: "date-time" }),
    updatedAt: t.String({ format: "date-time" }),
  });

  export const SubmissionWithDetails = t.Object({
    ...Submission.properties,
    answer: t.Optional(t.Any()),
    result: t.Optional(t.Any()),
    feedback: t.Optional(t.Nullable(t.String())),
  });

  export const CreateBody = t.Object({
    questionId: t.String({ format: "uuid" }),
    answer: t.Any(),
  });

  export const UpdateBody = t.Partial(
    t.Object({
      answer: t.Any(),
      status: SubmissionStatusEnum,
      score: t.Number(),
      band: VstepBand,
      feedback: t.String(),
    }),
  );

  export const GradeBody = t.Object({
    score: t.Number(),
    band: t.Optional(VstepBand),
    feedback: t.Optional(t.String()),
  });

  export type Submission = typeof Submission.static;
  export type SubmissionWithDetails = typeof SubmissionWithDetails.static;
  export type CreateBody = typeof CreateBody.static;
  export type UpdateBody = typeof UpdateBody.static;
}
