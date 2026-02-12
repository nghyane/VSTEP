import type { UserProgress } from "@db/index";
import { db, table } from "@db/index";
import { and, desc, eq, inArray } from "drizzle-orm";
import { computeStats, computeTrend } from "./trends";

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
  const { avg, stdDev } = computeStats(scores);

  return {
    progress: progress ?? null,
    recentScores,
    windowAvg: avg !== null ? Math.round(avg * 10) / 10 : null,
    windowStdDev: stdDev !== null ? Math.round(stdDev * 100) / 100 : null,
    trend: computeTrend(scores, stdDev),
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

  const grouped = allScores.reduce((m, r) => {
    const arr = m.get(r.skill) ?? [];
    if (arr.length < 10) m.set(r.skill, [...arr, r.score]);
    return m;
  }, new Map<string, number[]>());

  const result = Object.fromEntries(
    skills.map((s) => {
      const sc = grouped.get(s) ?? [];
      const { avg, stdDev } = computeStats(sc);
      return [
        s,
        {
          current: avg !== null ? Math.round(avg * 10) / 10 : 0,
          trend: computeTrend(sc, stdDev),
        },
      ];
    }),
  );

  return { skills: result, goal: goal ?? null };
}
