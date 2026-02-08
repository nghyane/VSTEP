import {
  QuestionLevel,
  Skill,
  StreakDirection,
  VstepBand,
} from "@common/enums";
import { t } from "elysia";

export const ProgressSchema = t.Object({
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

export type ProgressSchema = typeof ProgressSchema.static;

export const ProgressGoal = t.Object({
  id: t.String({ format: "uuid" }),
  userId: t.String({ format: "uuid" }),
  targetBand: VstepBand,
  currentEstimatedBand: t.Nullable(t.String()),
  deadline: t.Nullable(t.String({ format: "date-time" })),
  dailyStudyTimeMinutes: t.Number(),
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
});

export type ProgressGoal = typeof ProgressGoal.static;

export const ProgressOverviewResponse = t.Object({
  skills: t.Array(ProgressSchema),
  goal: t.Nullable(ProgressGoal),
});

export type ProgressOverviewResponse = typeof ProgressOverviewResponse.static;

export const ProgressRecentScore = t.Object({
  score: t.Number(),
  createdAt: t.String({ format: "date-time" }),
});

export const ProgressTrend = t.Union([
  t.Literal("improving"),
  t.Literal("stable"),
  t.Literal("declining"),
  t.Literal("inconsistent"),
  t.Literal("insufficient_data"),
]);

export const ProgressSkillDetailResponse = t.Object({
  progress: t.Nullable(ProgressSchema),
  recentScores: t.Array(ProgressRecentScore),
  windowAvg: t.Nullable(t.Number()),
  windowStdDev: t.Nullable(t.Number()),
  trend: ProgressTrend,
});

export type ProgressSkillDetailResponse =
  typeof ProgressSkillDetailResponse.static;

export const ProgressSpiderChartSkill = t.Object({
  current: t.Number(),
  trend: t.String(),
});

export const ProgressSpiderChartResponse = t.Object({
  skills: t.Record(t.String(), ProgressSpiderChartSkill),
  goal: t.Nullable(ProgressGoal),
});

export type ProgressSpiderChartResponse =
  typeof ProgressSpiderChartResponse.static;
