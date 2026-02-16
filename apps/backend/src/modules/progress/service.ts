import { scoreToLevel } from "@common/scoring";
import type { DbTransaction, UserProgress } from "@db/index";
import { db, table } from "@db/index";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  computeStats,
  computeTrend,
  TREND_THRESHOLDS,
  trendToDirection,
} from "./trends";

export const WINDOW_SIZE = 10;

/**
 * Fetch top-N recent scores per skill for a user, bounded in SQL.
 * Uses ROW_NUMBER() window function — returns at most WINDOW_SIZE rows per skill.
 */
export async function recentScores(userId: string) {
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
export async function recentScoresForUsers(userIds: string[]) {
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

export async function record(
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

export async function sync(
  userId: string,
  skill: UserProgress["skill"],
  tx?: DbTransaction,
) {
  const executor = tx ?? db;

  const [recentScoresData, existing] = await Promise.all([
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
      .limit(WINDOW_SIZE),
    executor.query.userProgress.findFirst({
      where: and(
        eq(table.userProgress.userId, userId),
        eq(table.userProgress.skill, skill),
      ),
    }),
  ]);

  const scores = recentScoresData.map((r) => r.score);
  const { avg, deviation } = computeStats(scores);
  const trend = computeTrend(scores, deviation);

  const currentLevel = avg !== null ? scoreToLevel(avg) : "A1";

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
