import { t } from "elysia";

export const AutoGradeResult = t.Object({
  correctCount: t.Integer({ minimum: 0 }),
  totalCount: t.Integer({ minimum: 0 }),
  score: t.Number({ minimum: 0, maximum: 10 }),
  band: t.Optional(t.Nullable(t.String())),
  gradedAt: t.Optional(t.String()),
});

export const HumanGradeResult = t.Object({
  overallScore: t.Number({ minimum: 0, maximum: 10 }),
  band: t.Optional(t.String()),
  criteriaScores: t.Optional(t.Record(t.String(), t.Number())),
  feedback: t.Optional(t.String()),
  confidence: t.Optional(t.Integer({ minimum: 0, maximum: 100 })),
  reviewPending: t.Optional(t.Boolean()),
});

export const GradingResult = t.Union([AutoGradeResult, HumanGradeResult]);

const BlueprintSection = t.Object({
  questionIds: t.Array(t.String({ format: "uuid" })),
});

export const ExamBlueprint = t.Object({
  listening: t.Optional(BlueprintSection),
  reading: t.Optional(BlueprintSection),
  writing: t.Optional(BlueprintSection),
  speaking: t.Optional(BlueprintSection),
  durationMinutes: t.Optional(t.Integer({ minimum: 1 })),
});

export type AutoGradeResult = typeof AutoGradeResult.static;
export type HumanGradeResult = typeof HumanGradeResult.static;
export type GradingResult = typeof GradingResult.static;
export type ExamBlueprint = typeof ExamBlueprint.static;
