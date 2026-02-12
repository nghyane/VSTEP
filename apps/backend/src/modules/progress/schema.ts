import { userGoals, userProgress } from "@db/schema";
import { createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";

export const SkillProgress = createSelectSchema(userProgress);
export type SkillProgress = typeof SkillProgress.static;

export const Goal = createSelectSchema(userGoals);
export type Goal = typeof Goal.static;

export const ProgressOverviewResponse = t.Object({
  skills: t.Array(SkillProgress),
  goal: t.Nullable(Goal),
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
  progress: t.Nullable(SkillProgress),
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
  goal: t.Nullable(Goal),
});

export type ProgressSpiderChartResponse =
  typeof ProgressSpiderChartResponse.static;
