import { t } from "elysia";

/** Auto-grade result for listening/reading MCQ (computed locally). */
export const AutoGradeResult = t.Object({
  correctCount: t.Integer({ minimum: 0 }),
  totalCount: t.Integer({ minimum: 0 }),
  score: t.Number({ minimum: 0, maximum: 10 }),
  band: t.Optional(t.Nullable(t.String())),
  gradedAt: t.Optional(t.String()),
});

/** AI grade result from grading service (writing/speaking). */
export const AIGradeResult = t.Object({
  overallScore: t.Number({ minimum: 0, maximum: 10 }),
  band: t.Optional(t.String()),
  criteriaScores: t.Record(t.String(), t.Number()),
  feedback: t.String(),
  grammarErrors: t.Optional(
    t.Array(
      t.Object({
        offset: t.Integer(),
        length: t.Integer(),
        message: t.String(),
        suggestion: t.Optional(t.String()),
      }),
    ),
  ),
  confidence: t.Union([
    t.Literal("high"),
    t.Literal("medium"),
    t.Literal("low"),
  ]),
  gradedAt: t.Optional(t.String()),
});

/** Instructor review result (override or accept AI grade). */
export const HumanGradeResult = t.Object({
  overallScore: t.Number({ minimum: 0, maximum: 10 }),
  band: t.Optional(t.String()),
  criteriaScores: t.Optional(t.Record(t.String(), t.Number())),
  feedback: t.Optional(t.String()),
  reviewerId: t.String({ format: "uuid" }),
  reviewedAt: t.String(),
  reviewComment: t.Optional(t.String()),
});

export const GradingResult = t.Union([
  AutoGradeResult,
  AIGradeResult,
  HumanGradeResult,
]);

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
export type AIGradeResult = typeof AIGradeResult.static;
export type HumanGradeResult = typeof HumanGradeResult.static;
export type GradingResult = typeof GradingResult.static;
export type ExamBlueprint = typeof ExamBlueprint.static;
