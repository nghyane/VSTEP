import {
  PlacementConfidence,
  PlacementSource,
  QuestionLevel,
  VstepBand,
} from "@db/enums";
import { t } from "elysia";

// --- Response schemas ---

const PlacementLevels = t.Object({
  listening: QuestionLevel,
  reading: QuestionLevel,
  writing: QuestionLevel,
  speaking: QuestionLevel,
});

const WeakPoint = t.Object({
  skill: t.String(),
  category: t.String(),
  name: t.String(),
});

export const OnboardingStatus = t.Object({
  completed: t.Boolean(),
  placement: t.Union([
    t.Object({
      source: PlacementSource,
      confidence: PlacementConfidence,
      levels: PlacementLevels,
      estimatedBand: t.Union([VstepBand, t.Null()]),
    }),
    t.Null(),
  ]),
  hasGoal: t.Boolean(),
  needsVerification: t.Boolean(),
});

export const PlacementResult = t.Object({
  source: PlacementSource,
  confidence: PlacementConfidence,
  levels: PlacementLevels,
  estimatedBand: t.Union([VstepBand, t.Null()]),
  weakPoints: t.Array(WeakPoint),
  needsVerification: t.Boolean(),
});

export const PlacementStarted = t.Object({
  sessionId: t.String({ format: "uuid" }),
  examId: t.String({ format: "uuid" }),
  questionCount: t.Integer(),
});

// --- Request schemas ---

export const SelfAssessBody = t.Object({
  listening: QuestionLevel,
  reading: QuestionLevel,
  writing: QuestionLevel,
  speaking: QuestionLevel,
  targetBand: VstepBand,
  deadline: t.Optional(t.String({ format: "date-time" })),
  dailyStudyTimeMinutes: t.Optional(t.Integer({ minimum: 5, maximum: 480 })),
});

export const SkipBody = t.Object({
  targetBand: VstepBand,
  englishYears: t.Optional(t.Integer({ minimum: 0, maximum: 50 })),
  previousTest: t.Optional(
    t.UnionEnum(["ielts", "toeic", "vstep", "other", "none"]),
  ),
  previousScore: t.Optional(t.String()),
  deadline: t.Optional(t.String({ format: "date-time" })),
  dailyStudyTimeMinutes: t.Optional(t.Integer({ minimum: 5, maximum: 480 })),
});

export const GoalBody = t.Object({
  targetBand: VstepBand,
  deadline: t.Optional(t.String({ format: "date-time" })),
  dailyStudyTimeMinutes: t.Optional(t.Integer({ minimum: 5, maximum: 480 })),
});

// Static types
export type SelfAssessBody = typeof SelfAssessBody.static;
export type SkipBody = typeof SkipBody.static;
export type GoalBody = typeof GoalBody.static;
