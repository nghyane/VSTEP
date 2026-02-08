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

export const SubmissionSchema = t.Object({
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

export const SubmissionWithDetailsSchema = t.Object({
  ...SubmissionSchema.properties,
  answer: t.Optional(t.Nullable(SubmissionAnswer)),
  result: t.Optional(t.Nullable(GradingResult)),
  feedback: t.Optional(t.Nullable(t.String({ maxLength: 10000 }))),
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

export type SubmissionSchema = typeof SubmissionSchema.static;
export type SubmissionWithDetailsSchema =
  typeof SubmissionWithDetailsSchema.static;
export type SubmissionCreateBody = typeof SubmissionCreateBody.static;
export type SubmissionUpdateBody = typeof SubmissionUpdateBody.static;
export type SubmissionGradeBody = typeof SubmissionGradeBody.static;
export type SubmissionListQuery = typeof SubmissionListQuery.static;
