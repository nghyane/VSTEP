import { Skill, SubmissionStatus as SubmissionStatusEnum } from "@common/enums";
import { t } from "elysia";

export namespace SubmissionModel {
  export const Submission = t.Object({
    id: t.String({ format: "uuid" }),
    userId: t.String({ format: "uuid" }),
    questionId: t.String({ format: "uuid" }),
    skill: Skill,
    status: SubmissionStatusEnum,
    score: t.Optional(t.Nullable(t.Number())),
    band: t.Optional(
      t.Nullable(
        t.Union([
          t.Literal("A1"),
          t.Literal("A2"),
          t.Literal("B1"),
          t.Literal("B2"),
          t.Literal("C1"),
        ]),
      ),
    ),
    completedAt: t.Optional(t.String()),
    createdAt: t.String(),
    updatedAt: t.String(),
  });

  export const SubmissionWithDetails = t.Object({
    ...Submission.properties,
    answer: t.Optional(t.Any()),
    result: t.Optional(t.Any()),
    feedback: t.Optional(t.Nullable(t.String())),
  });

  export const CreateBody = t.Object({
    questionId: t.String({ format: "uuid" }),
    skill: Skill,
    answer: t.Any(),
  });

  export const UpdateBody = t.Partial(
    t.Object({
      answer: t.Any(),
      status: SubmissionStatusEnum,
      score: t.Number(),
      band: t.Union([
        t.Literal("A1"),
        t.Literal("A2"),
        t.Literal("B1"),
        t.Literal("B2"),
        t.Literal("C1"),
      ]),
      feedback: t.String(),
    }),
  );

  export const GradeBody = t.Object({
    score: t.Number(),
    band: t.Optional(t.String()),
    feedback: t.Optional(t.String()),
  });

  export type Submission = typeof Submission.static;
  export type SubmissionWithDetails = typeof SubmissionWithDetails.static;
  export type CreateBody = typeof CreateBody.static;
  export type UpdateBody = typeof UpdateBody.static;
}
