import { BAND_THRESHOLDS } from "@common/scoring";
import type { UserProgress } from "@db/index";
import { db, table } from "@db/index";
import { SKILLS } from "@db/schema/enums";
import { and, desc, eq } from "drizzle-orm";
import { latest } from "./goals";
import { recentScores, WINDOW_SIZE } from "./service";
import {
  bandMinScore,
  computeEta,
  computeStats,
  computeTrend,
  round1,
  round2,
  type Trend,
} from "./trends";

function daysUntil(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000);
}

const BAND_ORDER: Record<string, number> = { B1: 1, B2: 2, C1: 3 };

/** VSTEP overall = lowest of 4 skills. Returns null if any skill missing. */
function overallBand(records: UserProgress[]): string | null {
  if (records.length < SKILLS.length) return null;

  let minOrder = Number.POSITIVE_INFINITY;
  let minBand: string | null = null;

  for (const r of records) {
    const threshold =
      BAND_THRESHOLDS[r.currentLevel as keyof typeof BAND_THRESHOLDS];
    if (threshold === undefined) return null;
    const order = BAND_ORDER[r.currentLevel] ?? 0;
    if (order < minOrder) {
      minOrder = order;
      minBand = r.currentLevel;
    }
  }

  return minBand;
}

function enrichGoal(
  goal: Awaited<ReturnType<typeof latest>>,
  records: UserProgress[],
  etaWeeks: number | null,
) {
  if (!goal) return null;

  const current = overallBand(records);
  const achieved =
    current !== null &&
    (BAND_ORDER[current] ?? 0) >= (BAND_ORDER[goal.targetBand] ?? 0);

  const daysRemaining = goal.deadline ? daysUntil(goal.deadline) : null;

  const onTrack =
    etaWeeks !== null && daysRemaining !== null
      ? etaWeeks * 7 <= daysRemaining
      : null;

  return { ...goal, achieved, onTrack, daysRemaining };
}

export async function overview(userId: string) {
  const [records, goal, allScores] = await Promise.all([
    db.query.userProgress.findMany({
      where: eq(table.userProgress.userId, userId),
    }),
    latest(userId),
    recentScores(userId),
  ]);

  // Compute max ETA across skills (bottleneck = slowest skill)
  let maxEta: number | null = null;
  if (goal) {
    const targetScore = bandMinScore(goal.targetBand);
    if (targetScore !== undefined) {
      const scoresBySkill = groupBySkill(allScores);
      for (const s of SKILLS) {
        const group = scoresBySkill.get(s);
        if (!group) continue;
        const eta = computeEta(group.scores, group.timestamps, targetScore);
        if (eta !== null && (maxEta === null || eta > maxEta)) maxEta = eta;
      }
    }
  }

  return { skills: records, goal: enrichGoal(goal, records, maxEta) };
}

export async function bySkill(userId: string, skill: UserProgress["skill"]) {
  const [progress, scoreHistory, goal] = await Promise.all([
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
      .limit(WINDOW_SIZE),
    latest(userId),
  ]);

  const scores = scoreHistory.map((r) => r.score);
  const timestamps = scoreHistory.map((r) => r.createdAt);
  const { avg, deviation } = computeStats(scores);

  const targetScore = goal ? bandMinScore(goal.targetBand) : undefined;

  const eta =
    targetScore !== undefined
      ? computeEta(scores, timestamps, targetScore)
      : null;

  return {
    progress: progress ?? null,
    recentScores: scoreHistory,
    windowAvg: avg !== null ? round1(avg) : null,
    windowDeviation: deviation !== null ? round2(deviation) : null,
    trend: computeTrend(scores, deviation),
    eta,
  };
}

function groupBySkill(
  allScores: { skill: string; score: number; createdAt: string }[],
) {
  const map = new Map<string, { scores: number[]; timestamps: string[] }>();
  for (const r of allScores) {
    let group = map.get(r.skill);
    if (!group) {
      group = { scores: [], timestamps: [] };
      map.set(r.skill, group);
    }
    group.scores.push(r.score);
    group.timestamps.push(r.createdAt);
  }
  return map;
}

export async function spiderChart(userId: string) {
  const [allScores, goal] = await Promise.all([
    recentScores(userId),
    latest(userId),
  ]);

  const targetScore = goal ? bandMinScore(goal.targetBand) : undefined;
  const scoresBySkill = groupBySkill(allScores);

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
