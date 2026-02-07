import { and, desc, eq } from "drizzle-orm";
import type { UserProgress } from "@/db";
import { db, table } from "@/db";

class ProgressService {
  /** Overview: all 4 skills with latest stats */
  static async getOverview(userId: string) {
    const records = await db.query.userProgress.findMany({
      where: eq(table.userProgress.userId, userId),
    });

    // Get the latest goal if any
    const goal = await db.query.userGoals.findFirst({
      where: eq(table.userGoals.userId, userId),
      orderBy: desc(table.userGoals.createdAt),
    });

    return {
      skills: records,
      goal: goal ?? null,
    };
  }

  /** Single skill detail with sliding window */
  static async getBySkill(skill: UserProgress["skill"], userId: string) {
    const progress = await db.query.userProgress.findFirst({
      where: and(
        eq(table.userProgress.userId, userId),
        eq(table.userProgress.skill, skill),
      ),
    });

    // Sliding window: last 10 scores
    const recentScores = await db
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
      .limit(10);

    // Compute metrics
    const scores = recentScores.map((r) => r.score);
    const windowAvg =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : null;

    const windowStdDev =
      scores.length > 1
        ? Math.sqrt(
            scores.reduce((sum, s) => sum + (s - windowAvg!) ** 2, 0) /
              (scores.length - 1),
          )
        : null;

    // Trend (need at least 6 scores: 3 recent vs 3 previous)
    let trend:
      | "improving"
      | "stable"
      | "declining"
      | "inconsistent"
      | "insufficient_data" = "insufficient_data";
    if (scores.length >= 6 && windowStdDev !== null) {
      if (windowStdDev >= 1.5) {
        trend = "inconsistent";
      } else {
        const recent3 = scores.slice(0, 3);
        const prev3 = scores.slice(3, 6);
        const avgRecent = recent3.reduce((a, b) => a + b, 0) / 3;
        const avgPrev = prev3.reduce((a, b) => a + b, 0) / 3;
        const delta = avgRecent - avgPrev;
        if (delta >= 0.5) trend = "improving";
        else if (delta <= -0.5) trend = "declining";
        else trend = "stable";
      }
    } else if (scores.length >= 3) {
      trend =
        windowStdDev !== null && windowStdDev >= 1.5
          ? "inconsistent"
          : "stable";
    }

    return {
      progress: progress ?? null,
      recentScores,
      windowAvg: windowAvg !== null ? Math.round(windowAvg * 10) / 10 : null,
      windowStdDev:
        windowStdDev !== null ? Math.round(windowStdDev * 100) / 100 : null,
      trend,
    };
  }

  /** Spider chart data for visualization */
  static async getSpiderChart(userId: string) {
    const skills = ["listening", "reading", "writing", "speaking"] as const;
    const result: Record<string, { current: number; trend: string }> = {};

    for (const skill of skills) {
      const detail = await ProgressService.getBySkill(skill, userId);
      result[skill] = {
        current: detail.windowAvg !== null ? detail.windowAvg * 10 : 0, // normalize 0-100
        trend: detail.trend,
      };
    }

    // Goal
    const goal = await db.query.userGoals.findFirst({
      where: eq(table.userGoals.userId, userId),
      orderBy: desc(table.userGoals.createdAt),
    });

    return {
      skills: result,
      goal: goal ?? null,
    };
  }
}

export { ProgressService };
