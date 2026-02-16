import { SKILLS } from "@db/enums";
import type { UserProgress } from "@db/index";
import { db, table } from "@db/index";
import { and, desc, eq } from "drizzle-orm";
import { latest } from "./goals";
import { recentScores } from "./service";
import {
  bandMinScore,
  computeEta,
  computeStats,
  computeTrend,
  round1,
  round2,
  type Trend,
} from "./trends";

export async function overview(userId: string) {
  const [records, goal] = await Promise.all([
    db.query.userProgress.findMany({
      where: eq(table.userProgress.userId, userId),
    }),
    latest(userId),
  ]);

  return { skills: records, goal };
}

export async function bySkill(userId: string, skill: UserProgress["skill"]) {
  const [progress, recentScoresData, goal] = await Promise.all([
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
    latest(userId),
  ]);

  const scores = recentScoresData.map((r) => r.score);
  const timestamps = recentScoresData.map((r) => r.createdAt);
  const { avg, deviation } = computeStats(scores);

  const targetScore = goal ? bandMinScore(goal.targetBand) : undefined;

  const eta =
    targetScore !== undefined
      ? computeEta(scores, timestamps, targetScore)
      : null;

  return {
    progress: progress ?? null,
    recentScores: recentScoresData,
    windowAvg: avg !== null ? round1(avg) : null,
    windowDeviation: deviation !== null ? round2(deviation) : null,
    trend: computeTrend(scores, deviation),
    eta,
  };
}

export async function spiderChart(userId: string) {
  const [allScores, goal] = await Promise.all([
    recentScores(userId),
    latest(userId),
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

  const skills: Record<string, { current: number; trend: Trend }> = {};
  const perSkill: Record<string, number | null> = {};

  for (const s of SKILLS) {
    const group = scoresBySkill.get(s);
    const scores = group?.scores ?? [];
    const { avg, deviation } = computeStats(scores);

    skills[s] = {
      current: avg !== null ? round1(avg) : 0,
      trend: computeTrend(scores, deviation),
    };

    perSkill[s] =
      targetScore !== undefined && group
        ? computeEta(group.scores, group.timestamps, targetScore)
        : null;
  }

  const validEtas = Object.values(perSkill).filter(
    (v): v is number => v !== null,
  );
  const overallWeeks =
    targetScore !== undefined && validEtas.length > 0
      ? Math.max(...validEtas)
      : null;

  return { skills, goal, eta: { weeks: overallWeeks, perSkill } };
}
