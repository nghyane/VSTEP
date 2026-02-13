import { scoreToBand } from "@common/scoring";
import type { DbTransaction } from "@db/index";

export async function recordSkillScore(
  userId: string,
  skill: UserProgress["skill"],
  submissionId: string | null,
  score: number,
  tx?: DbTransaction,
) {
  const executor = tx ?? db;
  await executor.insert(table.userSkillScores).values({
    userId,
    skill,
    submissionId,
    score,
  });
}

export async function updateUserProgress(
  userId: string,
  skill: UserProgress["skill"],
  tx?: DbTransaction,
) {
  const executor = tx ?? db;

  const recentScores = await executor
    .select({ score: table.userSkillScores.score })
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
  const { avg, stdDev } = computeStats(scores);
  const trend = computeTrend(scores, stdDev);

  const currentLevel = avg !== null ? (scoreToBand(avg) ?? "A2") : "A2";

  const streakDirection =
    trend === "improving"
      ? ("up" as const)
      : trend === "declining"
        ? ("down" as const)
        : ("neutral" as const);

  const existing = await executor.query.userProgress.findFirst({
    where: and(
      eq(table.userProgress.userId, userId),
      eq(table.userProgress.skill, skill),
    ),
  });

  const prevDirection = existing?.streakDirection;
  const streakCount =
    prevDirection === streakDirection ? (existing?.streakCount ?? 0) + 1 : 1;

  const attemptCount = (existing?.attemptCount ?? 0) + 1;

  const currentScaffold = existing?.scaffoldLevel ?? 1;
  const scaffoldLevel =
    avg !== null && avg > 8.0
      ? Math.min(currentScaffold + 1, 5)
      : avg !== null && avg < 5.0
        ? Math.max(currentScaffold - 1, 1)
        : currentScaffold;

  await executor
    .insert(table.userProgress)
    .values({
      userId,
      skill,
      currentLevel,
      scaffoldLevel,
      streakCount,
      streakDirection,
      attemptCount,
    })
    .onConflictDoUpdate({
      target: [table.userProgress.userId, table.userProgress.skill],
      set: {
        currentLevel,
        scaffoldLevel,
        streakCount,
        streakDirection,
        attemptCount,
        updatedAt: new Date().toISOString(),
      },
    });
}

// TODO(P2): Implement goal management functions
//   - createGoal(userId, { targetBand, deadline, dailyStudyTimeMinutes })
//   - updateGoal(userId, goalId, partial)
//   - deleteGoal(userId, goalId)
//   - Currently userGoals table is read-only (never inserted/updated)

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
          inArray(table.userSkillScores.skill, skills),
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
