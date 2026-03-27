import { VstepBand } from "@db/enums";
import { t } from "elysia";

/** Auto-grade result for listening/reading (computed locally). */
export const AutoResult = t.Object({
  type: t.Literal("auto"),
  correctCount: t.Integer({ minimum: 0 }),
  totalCount: t.Integer({ minimum: 0 }),
  score: t.Number({ minimum: 0, maximum: 10 }),
  band: t.Optional(VstepBand),
  gradedAt: t.String(),
});

/** AI grade result from grading service (writing/speaking). */
export const AIResult = t.Object({
  type: t.Literal("ai"),
  overallScore: t.Number({ minimum: 0, maximum: 10 }),
  band: t.Optional(VstepBand),
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
  confidence: t.UnionEnum(["high", "medium", "low"]),
  gradedAt: t.String(),
});

/** Instructor review result (override or accept AI grade). */
export const HumanResult = t.Object({
  type: t.Literal("human"),
  overallScore: t.Number({ minimum: 0, maximum: 10 }),
  band: t.Optional(VstepBand),
  criteriaScores: t.Optional(t.Record(t.String(), t.Number())),
  feedback: t.Optional(t.String()),
  reviewerId: t.String({ format: "uuid" }),
  reviewedAt: t.String(),
  reviewComment: t.Optional(t.String()),
});

export const Result = t.Union([AutoResult, AIResult, HumanResult]);

export type AutoResult = typeof AutoResult.static;
export type AIResult = typeof AIResult.static;
export type HumanResult = typeof HumanResult.static;
export type Result = typeof Result.static;
