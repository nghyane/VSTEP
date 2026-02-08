import { and, desc, eq, inArray } from "drizzle-orm";
import type { UserProgress } from "@/db";
import { db, table } from "@/db";

type Trend =
  | "improving"
  | "stable"
  | "declining"
  | "inconsistent"
  | "insufficient_data";

export function computeTrend(scores: number[], stdDev: number | null): Trend {
  if (scores.length >= 6 && stdDev !== null) {
    if (stdDev >= 1.5) return "inconsistent";
    const recent3 = scores.slice(0, 3);
    const prev3 = scores.slice(3, 6);
    const avgRecent = recent3.reduce((a, b) => a + b, 0) / 3;
    const avgPrev = prev3.reduce((a, b) => a + b, 0) / 3;
    const delta = avgRecent - avgPrev;
    if (delta >= 0.5) return "improving";
    if (delta <= -0.5) return "declining";
    return "stable";
  }
  if (scores.length >= 3) {
    return stdDev !== null && stdDev >= 1.5 ? "inconsistent" : "stable";
  }
  return "insufficient_data";
}

/** Overview: all 4 skills with latest stats */
export async function getProgressOverview(userId: string) {
  const records = await db.query.userProgress.findMany({
    where: eq(table.userProgress.userId, userId),
  });

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
export async function getProgressBySkill(
  skill: UserProgress["skill"],
  userId: string,
) {
  const progress = await db.query.userProgress.findFirst({
    where: and(
      eq(table.userProgress.userId, userId),
      eq(table.userProgress.skill, skill),
    ),
  });

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

  const trend = computeTrend(scores, windowStdDev);

  return {
    progress: progress ?? null,
    recentScores,
    windowAvg: windowAvg !== null ? Math.round(windowAvg * 10) / 10 : null,
    windowStdDev:
      windowStdDev !== null ? Math.round(windowStdDev * 100) / 100 : null,
    trend,
  };
}

/** Spider chart data — batch query (2 queries instead of 8) */
export async function getSpiderChart(userId: string) {
  const skills = ["listening", "reading", "writing", "speaking"] as const;

  // Batch: all recent scores + goal in 2 queries
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

  // Group scores by skill (keep last 10 per skill)
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

  return {
    skills: result,
    goal: goal ?? null,
  };
}
