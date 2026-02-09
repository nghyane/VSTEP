import { and, desc, eq, inArray } from "drizzle-orm";
import type { UserProgress } from "@/db";
import { db, table } from "@/db";
import { computeTrend } from "./pure";

// ── Pure functions ──────────────────────────────────────────────────

/**
 * Classify trend from recent scores using volatility and a 3-vs-3 average delta.
 * Thresholds: stdDev >= 1.5 => inconsistent, delta >= 0.5 => improving, delta <= -0.5 => declining.
 */
export { computeTrend };

// ── Public API ──────────────────────────────────────────────────────

export async function getProgressOverview(userId: string) {
  const [records, goal] = await Promise.all([
    db.query.userProgress.findMany({
      where: eq(table.userProgress.userId, userId),
    }),
    db.query.userGoals.findFirst({
      where: eq(table.userGoals.userId, userId),
      orderBy: desc(table.userGoals.createdAt),
    }),
  ]);

  return { skills: records, goal: goal ?? null };
}

export async function getProgressBySkill(
  userId: string,
  skill: UserProgress["skill"],
) {
  const [progress, recentScores] = await Promise.all([
    db.query.userProgress.findFirst({
      where: and(
        eq(table.userProgress.userId, userId),
        eq(table.userProgress.skill, skill),
      ),
    }),
    db
      .select({
        score: table.userSkillScores.score,
        createdAt: table.userSkillScores.createdAt,
      })
      .from(table.userSkillScores)
      .where(
        and(
          eq(table.userSkillScores.userId, userId),
          eq(table.userSkillScores.skill, skill),
        ),
      )
      .orderBy(desc(table.userSkillScores.createdAt))
      .limit(10),
  ]);

  const scores = recentScores.map((r) => r.score);
  const windowAvg =
    scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null;

  const windowStdDev =
    scores.length > 1 && windowAvg !== null
      ? Math.sqrt(
          scores.reduce((sum, s) => sum + (s - windowAvg) ** 2, 0) /
            (scores.length - 1),
        )
      : null;

  return {
    progress: progress ?? null,
    recentScores,
    windowAvg: windowAvg !== null ? Math.round(windowAvg * 10) / 10 : null,
    windowStdDev:
      windowStdDev !== null ? Math.round(windowStdDev * 100) / 100 : null,
    trend: computeTrend(scores, windowStdDev),
  };
}

export async function getSpiderChart(userId: string) {
  const skills = ["listening", "reading", "writing", "speaking"] as const;

  const [allScores, goal] = await Promise.all([
    db
      .select({
        skill: table.userSkillScores.skill,
        score: table.userSkillScores.score,
        createdAt: table.userSkillScores.createdAt,
      })
      .from(table.userSkillScores)
      .where(
        and(
          eq(table.userSkillScores.userId, userId),
          inArray(table.userSkillScores.skill, [...skills]),
        ),
      )
      .orderBy(desc(table.userSkillScores.createdAt)),
    db.query.userGoals.findFirst({
      where: eq(table.userGoals.userId, userId),
      orderBy: desc(table.userGoals.createdAt),
    }),
  ]);

  const scoresBySkill = new Map<string, number[]>();
  for (const row of allScores) {
    const arr = scoresBySkill.get(row.skill) ?? [];
    if (arr.length < 10) arr.push(row.score);
    scoresBySkill.set(row.skill, arr);
  }

  const result: Record<string, { current: number; trend: string }> = {};
  for (const skill of skills) {
    const scores = scoresBySkill.get(skill) ?? [];
    const avg =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : null;
    const stdDev =
      scores.length > 1 && avg !== null
        ? Math.sqrt(
            scores.reduce((sum, s) => sum + (s - avg) ** 2, 0) /
              (scores.length - 1),
          )
        : null;

    result[skill] = {
      current: avg !== null ? Math.round(avg * 10) / 10 : 0,
      trend: computeTrend(scores, stdDev),
    };
  }

  return { skills: result, goal: goal ?? null };
}
