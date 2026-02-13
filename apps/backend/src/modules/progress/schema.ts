import { VstepBand } from "@db/enums";
import { userGoals, userProgress } from "@db/schema";
import { createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";

export const SkillProgress = createSelectSchema(userProgress);
export type SkillProgress = typeof SkillProgress.static;

export const Goal = createSelectSchema(userGoals);
export type Goal = typeof Goal.static;

export const GoalBody = t.Object({
  targetBand: VstepBand,
  deadline: t.String({ format: "date-time" }),
  dailyStudyTimeMinutes: t.Optional(t.Integer({ minimum: 5, maximum: 480 })),
});
export type GoalBody = typeof GoalBody.static;

export const GoalUpdateBody = t.Partial(GoalBody);
export type GoalUpdateBody = typeof GoalUpdateBody.static;

export const ProgressOverview = t.Object({
  skills: t.Array(SkillProgress),
  goal: t.Nullable(Goal),
});

export type ProgressOverview = typeof ProgressOverview.static;

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

export const ProgressSkillDetail = t.Object({
  progress: t.Nullable(SkillProgress),
  recentScores: t.Array(ProgressRecentScore),
  windowAvg: t.Nullable(t.Number()),
  windowDeviation: t.Nullable(t.Number()),
  trend: ProgressTrend,
});

export type ProgressSkillDetail = typeof ProgressSkillDetail.static;

export const ProgressSpiderChartSkill = t.Object({
  current: t.Number(),
  trend: t.String(),
});

export const ProgressSpiderChart = t.Object({
  skills: t.Record(t.String(), ProgressSpiderChartSkill),
  goal: t.Nullable(Goal),
});

export type ProgressSpiderChart = typeof ProgressSpiderChart.static;
