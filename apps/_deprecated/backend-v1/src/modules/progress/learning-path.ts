import { db, table } from "@db/index";
import { SKILLS } from "@db/schema/enums";
import { and, eq, sql } from "drizzle-orm";
import type { LearningPathResponse } from "./schema";
import { recentScores } from "./service";
import { bandMinScore, computeEta, computeStats } from "./trends";

const LEVELS = ["A2", "B1", "B2", "C1"] as const;

function levelIndex(level: string): number {
  const idx = LEVELS.indexOf(level as (typeof LEVELS)[number]);
  return idx === -1 ? 0 : idx;
}

function nextLevel(current: string): string {
  const idx = levelIndex(current);
  return LEVELS[Math.min(idx + 1, LEVELS.length - 1)] as string;
}

async function getWeakTopics(userId: string) {
  const ranked = db
    .select({
      kpId: table.knowledgePoints.id,
      kpName: table.knowledgePoints.name,
      masteryScore: table.userKnowledgeProgress.masteryScore,
      skill: table.questions.skill,
      rn: sql<number>`row_number() over (partition by ${table.questions.skill} order by ${table.userKnowledgeProgress.masteryScore} asc)`.as(
        "rn",
      ),
    })
    .from(table.userKnowledgeProgress)
    .innerJoin(
      table.knowledgePoints,
      and(
        eq(
          table.userKnowledgeProgress.knowledgePointId,
          table.knowledgePoints.id,
        ),
        eq(table.knowledgePoints.category, "topic"),
      ),
    )
    .innerJoin(
      table.questionKnowledgePoints,
      eq(
        table.knowledgePoints.id,
        table.questionKnowledgePoints.knowledgePointId,
      ),
    )
    .innerJoin(
      table.questions,
      eq(table.questionKnowledgePoints.questionId, table.questions.id),
    )
    .where(eq(table.userKnowledgeProgress.userId, userId))
    .as("ranked");

  const rows = await db
    .select({
      kpId: ranked.kpId,
      kpName: ranked.kpName,
      masteryScore: ranked.masteryScore,
      skill: ranked.skill,
    })
    .from(ranked)
    .where(sql`${ranked.rn} <= 3`);

  const result = new Map<
    string,
    { id: string; name: string; masteryScore: number }[]
  >();
  for (const row of rows) {
    let arr = result.get(row.skill);
    if (!arr) {
      arr = [];
      result.set(row.skill, arr);
    }
    arr.push({
      id: row.kpId,
      name: row.kpName,
      masteryScore: row.masteryScore,
    });
  }
  return result;
}

export async function learningPath(
  userId: string,
): Promise<LearningPathResponse> {
  const [progressRecords, goal, weakKPsData, allScores] = await Promise.all([
    db.query.userProgress.findMany({
      where: eq(table.userProgress.userId, userId),
    }),
    db.query.userGoals.findFirst({
      where: eq(table.userGoals.userId, userId),
    }),
    getWeakTopics(userId),
    recentScores(userId),
  ]);

  const progressBySkill = new Map(progressRecords.map((r) => [r.skill, r]));

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

  const dailyMinutes = goal?.dailyStudyTimeMinutes ?? 30;
  const totalWeeklySessions = Math.floor((dailyMinutes * 7) / 30);
  const remaining = Math.max(totalWeeklySessions - 4, 0);
  const targetBand = goal?.targetBand ?? null;

  const skillEntries = SKILLS.map((skill) => {
    const progress = progressBySkill.get(skill);
    const currentLevel = progress?.currentLevel ?? "A2";
    const targetLevel = targetBand ?? nextLevel(currentLevel);
    const gap = Math.max(levelIndex(targetLevel) - levelIndex(currentLevel), 0);
    const weakTopics = weakKPsData.get(skill) ?? [];
    const group = scoresBySkill.get(skill);
    const { avg } = computeStats(group?.scores ?? []);
    return { skill, currentLevel, targetLevel, gap, weakTopics, avg: avg ?? 0 };
  });

  const totalGap = skillEntries.reduce((sum, e) => sum + e.gap, 0);

  // SRS: nếu 2 skills chênh windowAvg ≤ 0.3 → cùng priority
  const sorted = [...skillEntries].sort((a, b) => {
    if (b.gap !== a.gap) return b.gap - a.gap;
    // Same gap — lower avg = higher priority
    if (Math.abs(a.avg - b.avg) > 0.3) return a.avg - b.avg;
    const order = ["listening", "reading", "writing", "speaking"];
    return order.indexOf(a.skill) - order.indexOf(b.skill);
  });

  const weeklyPlan = sorted.map((entry, idx) => {
    const extraSessions =
      totalGap > 0 ? Math.round((remaining * entry.gap) / totalGap) : 0;
    const sessionsPerWeek = 1 + extraSessions;
    const estimatedMinutes = sessionsPerWeek * 30;

    return {
      skill: entry.skill,
      currentLevel: entry.currentLevel,
      targetLevel: entry.targetLevel,
      sessionsPerWeek,
      focusArea: entry.weakTopics[0]?.name ?? null,
      recommendedLevel: entry.currentLevel,
      estimatedMinutes,
      weakTopics: entry.weakTopics.map((t) => ({
        id: t.id,
        name: t.name,
        masteryScore: t.masteryScore,
      })),
      priority: idx + 1,
    };
  });

  const totalMinutesPerWeek = weeklyPlan.reduce(
    (sum, s) => sum + s.estimatedMinutes,
    0,
  );

  let projectedImprovement: string | null = null;
  if (targetBand) {
    const targetScore = bandMinScore(targetBand);
    if (targetScore !== undefined) {
      let maxEta: number | null = null;
      for (const s of SKILLS) {
        const group = scoresBySkill.get(s);
        if (!group) continue;
        const eta = computeEta(group.scores, group.timestamps, targetScore);
        if (eta !== null && (maxEta === null || eta > maxEta)) maxEta = eta;
      }
      if (maxEta !== null) {
        const currentBand =
          progressRecords.length > 0
            ? progressRecords.reduce(
                (min, r) =>
                  levelIndex(r.currentLevel) < levelIndex(min)
                    ? r.currentLevel
                    : min,
                progressRecords[0]?.currentLevel ?? "A2",
              )
            : "A2";
        projectedImprovement = `${currentBand} → ${targetBand} trong ${maxEta} tuần`;
      }
    }
  }

  return { weeklyPlan, totalMinutesPerWeek, projectedImprovement };
}
