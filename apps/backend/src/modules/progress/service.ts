import { and, desc, eq, inArray } from "drizzle-orm";
import type { UserProgress } from "@/db";
import { db, table } from "@/db";

type Trend =
  | "improving"
  | "stable"
  | "declining"
  | "inconsistent"
  | "insufficient_data";

function average(scores: number[]): number | null {
  return scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : null;
}

function stdDev(scores: number[], mean: number): number | null {
  if (scores.length <= 1) return null;
  return Math.sqrt(
    scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / (scores.length - 1),
  );
}

function computeTrend(scores: number[], sd: number | null): Trend {
  if (scores.length >= 6 && sd !== null) {
    if (sd >= 1.5) return "inconsistent";
    const avgRecent = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const avgPrev = scores.slice(3, 6).reduce((a, b) => a + b, 0) / 3;
    const delta = avgRecent - avgPrev;
    if (delta >= 0.5) return "improving";
    if (delta <= -0.5) return "declining";
    return "stable";
  }
  if (scores.length >= 3) {
    return sd !== null && sd >= 1.5 ? "inconsistent" : "stable";
  }
  return "insufficient_data";
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export class ProgressService {
  /** Overview: all 4 skills with latest stats */
  static async getOverview(userId: string) {
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

  /** Single skill detail with sliding window */
  static async getBySkill(skill: UserProgress["skill"], userId: string) {
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
    const windowAvg = average(scores);
    const windowStdDev = windowAvg !== null ? stdDev(scores, windowAvg) : null;

    return {
      progress: progress ?? null,
      recentScores,
      windowAvg: windowAvg !== null ? round(windowAvg, 1) : null,
      windowStdDev: windowStdDev !== null ? round(windowStdDev, 2) : null,
      trend: computeTrend(scores, windowStdDev),
    };
  }

  /** Spider chart — batch query (2 queries instead of 8), reuse stat helpers */
  static async getSpiderChart(userId: string) {
    const skills = ["listening", "reading", "writing", "speaking"] as const;

    const [allScores, goal] = await Promise.all([
      db
        .select({
          skill: table.userSkillScores.skill,
          score: table.userSkillScores.score,
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

    // Group by skill, keep last 10 per skill
    const scoresBySkill = new Map<string, number[]>();
    for (const row of allScores) {
      const arr = scoresBySkill.get(row.skill) ?? [];
      if (arr.length < 10) arr.push(row.score);
      scoresBySkill.set(row.skill, arr);
    }

    const result: Record<string, { current: number; trend: string }> = {};
    for (const skill of skills) {
      const scores = scoresBySkill.get(skill) ?? [];
      const avg = average(scores);
      const sd = avg !== null ? stdDev(scores, avg) : null;
      result[skill] = {
        current: avg !== null ? round(avg, 1) * 10 : 0,
        trend: computeTrend(scores, sd),
      };
    }

    return { skills: result, goal: goal ?? null };
  }
}
