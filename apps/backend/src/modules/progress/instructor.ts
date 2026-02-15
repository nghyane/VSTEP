import { scoreToBand } from "@common/scoring";
import { SKILLS } from "@db/enums";
import { db, table } from "@db/index";
import { inArray } from "drizzle-orm";
import { getRecentScoresForUsers } from "./service";
import { bandMinScore, computeStats, computeTrend, round1 } from "./trends";

const AT_RISK_AVG_THRESHOLD = 5.0;
const AT_RISK_DEADLINE_DAYS = 30;

export async function getProgressForUsers(userIds: string[]) {
  if (userIds.length === 0) return [];

  const [progressRecords, scores] = await Promise.all([
    db
      .select()
      .from(table.userProgress)
      .where(inArray(table.userProgress.userId, userIds)),
    getRecentScoresForUsers(userIds),
  ]);

  const scoresByUserSkill = new Map<string, number[]>();
  for (const s of scores) {
    const key = `${s.userId}:${s.skill}`;
    let arr = scoresByUserSkill.get(key);
    if (!arr) {
      arr = [];
      scoresByUserSkill.set(key, arr);
    }
    arr.push(Number(s.score));
  }

  const progressByUserSkill = new Map<string, (typeof progressRecords)[0]>();
  for (const p of progressRecords) {
    progressByUserSkill.set(`${p.userId}:${p.skill}`, p);
  }

  return userIds.map((userId) => {
    const skills = Object.fromEntries(
      SKILLS.map((skill) => {
        const key = `${userId}:${skill}`;
        const recentScores = scoresByUserSkill.get(key) ?? [];
        const { avg, deviation } = computeStats(recentScores);
        const trend = computeTrend(recentScores, deviation);
        const progress = progressByUserSkill.get(key);

        return [
          skill,
          {
            currentLevel:
              progress?.currentLevel ??
              (avg !== null ? (scoreToBand(avg) ?? "A2") : null),
            avg: avg !== null ? round1(avg) : null,
            trend,
            attemptCount: progress?.attemptCount ?? 0,
            streakCount: progress?.streakCount ?? 0,
          },
        ];
      }),
    );
    return { userId, skills };
  });
}

export async function getAtRiskLearners(
  userIds: string[],
  precomputedProgress?: Awaited<ReturnType<typeof getProgressForUsers>>,
) {
  if (userIds.length === 0) return [];

  const [progressData, goals] = await Promise.all([
    precomputedProgress ?? getProgressForUsers(userIds),
    db
      .select()
      .from(table.userGoals)
      .where(inArray(table.userGoals.userId, userIds)),
  ]);

  const goalByUser = new Map(goals.map((g) => [g.userId, g]));
  const now = Date.now();
  const thirtyDaysMs = AT_RISK_DEADLINE_DAYS * 24 * 60 * 60 * 1000;

  return progressData.map(({ userId, skills }) => {
    const reasons: string[] = [];

    for (const [skill, data] of Object.entries(skills)) {
      if (data.trend === "declining") {
        reasons.push(`Declining trend in ${skill}`);
      }
      if (data.avg !== null && data.avg < AT_RISK_AVG_THRESHOLD) {
        reasons.push(`Low average (${data.avg}) in ${skill}`);
      }
    }

    const goal = goalByUser.get(userId);
    if (goal?.deadline) {
      const deadlineMs = new Date(goal.deadline).getTime();
      const approaching = deadlineMs - now < thirtyDaysMs && deadlineMs > now;
      if (approaching) {
        const currentBands = Object.values(skills)
          .map((s) => s.currentLevel)
          .filter(Boolean) as string[];
        const targetThreshold = bandMinScore(goal.targetBand);
        const allMeetTarget =
          currentBands.length > 0 &&
          currentBands.every((b) => {
            const bThreshold = bandMinScore(b) ?? 0;
            return targetThreshold !== undefined
              ? bThreshold >= targetThreshold
              : false;
          });

        if (!allMeetTarget) {
          const deadlineStr = goal.deadline.slice(0, 10);
          reasons.push(
            `Behind goal: target ${goal.targetBand} by ${deadlineStr}`,
          );
        }
      }
    }

    return { userId, atRisk: reasons.length > 0, reasons };
  });
}
