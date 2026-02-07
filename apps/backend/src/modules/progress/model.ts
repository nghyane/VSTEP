import {
  QuestionLevel,
  Skill,
  StreakDirection,
  VstepBand,
} from "@common/enums";
import { t } from "elysia";

export namespace ProgressModel {
  export const Progress = t.Object({
    id: t.String({ format: "uuid" }),
    userId: t.String({ format: "uuid" }),
    skill: Skill,
    currentLevel: QuestionLevel,
    targetLevel: t.Nullable(QuestionLevel),
    scaffoldLevel: t.Number(),
    streakCount: t.Number(),
    streakDirection: t.Nullable(StreakDirection),
    attemptCount: t.Number(),
    createdAt: t.String({ format: "date-time" }),
    updatedAt: t.String({ format: "date-time" }),
  });

  export type Progress = typeof Progress.static;

  export const Goal = t.Object({
    id: t.String({ format: "uuid" }),
    userId: t.String({ format: "uuid" }),
    targetBand: VstepBand,
    currentEstimatedBand: t.Nullable(t.String()),
    deadline: t.Nullable(t.String({ format: "date-time" })),
    dailyStudyTimeMinutes: t.Number(),
    createdAt: t.String({ format: "date-time" }),
    updatedAt: t.String({ format: "date-time" }),
  });

  export type Goal = typeof Goal.static;

  export const OverviewResponse = t.Object({
    skills: t.Array(Progress),
    goal: t.Nullable(Goal),
  });

  export type OverviewResponse = typeof OverviewResponse.static;

  export const RecentScore = t.Object({
    score: t.Number(),
    createdAt: t.String({ format: "date-time" }),
  });

  export const Trend = t.Union([
    t.Literal("improving"),
    t.Literal("stable"),
    t.Literal("declining"),
    t.Literal("inconsistent"),
    t.Literal("insufficient_data"),
  ]);

  export const SkillDetailResponse = t.Object({
    progress: t.Nullable(Progress),
    recentScores: t.Array(RecentScore),
    windowAvg: t.Nullable(t.Number()),
    windowStdDev: t.Nullable(t.Number()),
    trend: Trend,
  });

  export type SkillDetailResponse = typeof SkillDetailResponse.static;

  export const SpiderChartSkill = t.Object({
    current: t.Number(),
    trend: t.String(),
  });

  export const SpiderChartResponse = t.Object({
    skills: t.Record(t.String(), SpiderChartSkill),
    goal: t.Nullable(Goal),
  });

  export type SpiderChartResponse = typeof SpiderChartResponse.static;
}
