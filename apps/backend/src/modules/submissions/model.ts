import {
  Skill,
  SubmissionStatus as SubmissionStatusEnum,
  VstepBand,
} from "@common/enums";
import { SubmissionSchema } from "@db/typebox";
import { t } from "elysia";
import {
  GradingResult,
  SubmissionAnswer,
} from "@/modules/questions/content-schemas";

export const SubmissionWithDetailsSchema = t.Object({
  ...SubmissionSchema.properties,
  answer: t.Nullable(SubmissionAnswer),
  result: t.Nullable(GradingResult),
  feedback: t.Nullable(t.String({ maxLength: 10000 })),
});

export const SubmissionCreateBody = t.Object({
  questionId: t.String({ format: "uuid" }),
  answer: SubmissionAnswer,
});

export const SubmissionUpdateBody = t.Partial(
  t.Object({
    answer: SubmissionAnswer,
    status: SubmissionStatusEnum,
    score: t.Number({ minimum: 0, maximum: 10 }),
    band: VstepBand,
    feedback: t.String({ maxLength: 10000 }),
  }),
);

export const SubmissionGradeBody = t.Object({
  score: t.Number({ minimum: 0, maximum: 10 }),
  band: t.Optional(VstepBand),
  feedback: t.Optional(t.String({ maxLength: 10000 })),
});

export const SubmissionListQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  skill: t.Optional(Skill),
  status: t.Optional(SubmissionStatusEnum),
  userId: t.Optional(t.String({ format: "uuid" })),
});

export type SubmissionWithDetailsSchema =
  typeof SubmissionWithDetailsSchema.static;
export type SubmissionCreateBody = typeof SubmissionCreateBody.static;
export type SubmissionUpdateBody = typeof SubmissionUpdateBody.static;
export type SubmissionGradeBody = typeof SubmissionGradeBody.static;
export type SubmissionListQuery = typeof SubmissionListQuery.static;
