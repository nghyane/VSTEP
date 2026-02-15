import { scoreToBand } from "@common/scoring";
import { SKILLS } from "@db/enums";
import type { DbTransaction, UserProgress } from "@db/index";
import { db, table } from "@db/index";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getLatestGoal } from "./goals";
import {
  bandMinScore,
  computeEta,
  computeStats,
  computeTrend,
  round1,
  round2,
  TREND_THRESHOLDS,
  trendToDirection,
} from "./trends";

const WINDOW_SIZE = 10;

/**
 * Fetch top-N recent scores per skill for a user, bounded in SQL.
 * Uses ROW_NUMBER() window function — returns at most WINDOW_SIZE rows per skill.
 */
async function getRecentScoresAllSkills(userId: string) {
  const ranked = db
    .select({
      skill: table.userSkillScores.skill,
      score: table.userSkillScores.score,
      createdAt: table.userSkillScores.createdAt,
      rn: sql<number>`row_number() over (partition by ${table.userSkillScores.skill} order by ${table.userSkillScores.createdAt} desc)`.as(
        "rn",
      ),
    })
    .from(table.userSkillScores)
    .where(eq(table.userSkillScores.userId, userId))
    .as("ranked");

  return db
    .select({
      skill: ranked.skill,
      score: ranked.score,
      createdAt: ranked.createdAt,
    })
    .from(ranked)
    .where(sql`${ranked.rn} <= ${WINDOW_SIZE}`)
    .orderBy(ranked.skill, sql`${ranked.createdAt} desc`);
}

/**
 * Fetch top-N recent scores per (user, skill) for multiple users.
 * Uses ROW_NUMBER() window function — returns at most WINDOW_SIZE rows per user+skill.
 */
export async function getRecentScoresForUsers(userIds: string[]) {
  const ranked = db
    .select({
      userId: table.userSkillScores.userId,
      skill: table.userSkillScores.skill,
      score: table.userSkillScores.score,
      createdAt: table.userSkillScores.createdAt,
      rn: sql<number>`row_number() over (partition by ${table.userSkillScores.userId}, ${table.userSkillScores.skill} order by ${table.userSkillScores.createdAt} desc)`.as(
        "rn",
      ),
    })
    .from(table.userSkillScores)
    .where(inArray(table.userSkillScores.userId, userIds))
    .as("ranked");

  return db
    .select({
      userId: ranked.userId,
      skill: ranked.skill,
      score: ranked.score,
      createdAt: ranked.createdAt,
    })
    .from(ranked)
    .where(sql`${ranked.rn} <= ${WINDOW_SIZE}`);
}

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

  const [recentScores, existing] = await Promise.all([
    executor
      .select({ score: table.userSkillScores.score })
      .from(table.userSkillScores)
      .where(
        and(
          eq(table.userSkillScores.userId, userId),
          eq(table.userSkillScores.skill, skill),
        ),
      )
      .orderBy(desc(table.userSkillScores.createdAt))
      .limit(10),
    executor.query.userProgress.findFirst({
      where: and(
        eq(table.userProgress.userId, userId),
        eq(table.userProgress.skill, skill),
      ),
    }),
  ]);

  const scores = recentScores.map((r) => r.score);
  const { avg, deviation } = computeStats(scores);
  const trend = computeTrend(scores, deviation);

  const currentLevel = avg !== null ? (scoreToBand(avg) ?? "A2") : "A2";

  const streakDirection = trendToDirection(trend);

  const prevDirection = existing?.streakDirection;
  const streakCount =
    prevDirection === streakDirection ? (existing?.streakCount ?? 0) + 1 : 1;

  const attemptCount = (existing?.attemptCount ?? 0) + 1;

  const currentScaffold = existing?.scaffoldLevel ?? 1;
  const scaffoldLevel = (() => {
    if (avg === null || scores.length < TREND_THRESHOLDS.basicAnalysisMinScores)
      return currentScaffold;
    if (avg > 8.0 && streakDirection === "up" && streakCount >= 2)
      return Math.min(currentScaffold + 1, 5);
    if (avg < 5.0 && streakDirection === "down" && streakCount >= 2)
      return Math.max(currentScaffold - 1, 1);
    return currentScaffold;
  })();

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

export async function getProgressOverview(userId: string) {
  const [records, goal] = await Promise.all([
    db.query.userProgress.findMany({
      where: eq(table.userProgress.userId, userId),
    }),
    getLatestGoal(userId),
  ]);

  return { skills: records, goal };
}

export async function getProgressBySkill(
  userId: string,
  skill: UserProgress["skill"],
) {
  const [progress, recentScores, goal] = await Promise.all([
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
    getLatestGoal(userId),
  ]);

  const scores = recentScores.map((r) => r.score);
  const timestamps = recentScores.map((r) => r.createdAt);
  const { avg, deviation } = computeStats(scores);

  const targetScore = goal ? bandMinScore(goal.targetBand) : undefined;

  const eta =
    targetScore !== undefined
      ? computeEta(scores, timestamps, targetScore)
      : null;

  return {
    progress: progress ?? null,
    recentScores,
    windowAvg: avg !== null ? round1(avg) : null,
    windowDeviation: deviation !== null ? round2(deviation) : null,
    trend: computeTrend(scores, deviation),
    eta,
  };
}

export async function getSpiderChart(userId: string) {
  const [allScores, goal] = await Promise.all([
    getRecentScoresAllSkills(userId),
    getLatestGoal(userId),
  ]);

  const targetScore = goal ? bandMinScore(goal.targetBand) : undefined;

  // Group scores by skill (already bounded to 10 per skill by SQL)
  const scoresBySkill = new Map<
    string,
    { scores: number[]; timestamps: string[] }
  >();
  for (const r of allScores) {
    let group = scoresBySkill.get(r.skill);
    if (!group) {
      group = { scores: [], timestamps: [] };
      scoresBySkill.set(r.skill, group);
    }
    group.scores.push(r.score);
    group.timestamps.push(r.createdAt);
  }

  const perSkill: Record<string, number | null> = {};
  const skills = Object.fromEntries(
    SKILLS.map((s) => {
      const group = scoresBySkill.get(s);
      const scores = group?.scores ?? [];
      const { avg, deviation } = computeStats(scores);

      perSkill[s] =
        targetScore !== undefined && group
          ? computeEta(group.scores, group.timestamps, targetScore)
          : null;

      return [
        s,
        {
          current: avg !== null ? round1(avg) : 0,
          trend: computeTrend(scores, deviation),
        },
      ];
    }),
  );

  const validEtas = Object.values(perSkill).filter(
    (v): v is number => v !== null,
  );
  const overallWeeks =
    targetScore !== undefined && validEtas.length > 0
      ? Math.max(...validEtas)
      : null;

  return { skills, goal, eta: { weeks: overallWeeks, perSkill } };
}
