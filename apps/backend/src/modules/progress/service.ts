import { ConflictError, NotFoundError } from "@common/errors";
import { BAND_THRESHOLDS, scoreToBand } from "@common/scoring";
import { SKILLS } from "@db/enums";
import type { DbTransaction, UserProgress } from "@db/index";
import { db, table } from "@db/index";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { GoalBody, GoalUpdateBody } from "./schema";
import { computeStats, computeTrend } from "./trends";

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
          inArray(table.userSkillScores.skill, SKILLS),
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
    SKILLS.map((s) => {
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

// ── Goal CRUD ──────────────────────────────────────────────

export async function createGoal(userId: string, body: GoalBody) {
  const existing = await db.query.userGoals.findFirst({
    where: eq(table.userGoals.userId, userId),
  });
  if (existing) {
    throw new ConflictError(
      "User already has an active goal. Update or delete it first.",
    );
  }

  const rows = await db
    .insert(table.userGoals)
    .values({
      userId,
      targetBand: body.targetBand,
      deadline: body.deadline,
      ...(body.dailyStudyTimeMinutes !== undefined && {
        dailyStudyTimeMinutes: body.dailyStudyTimeMinutes,
      }),
    })
    .returning();

  return rows[0] as (typeof rows)[0];
}

export async function updateGoal(
  userId: string,
  goalId: string,
  body: GoalUpdateBody,
) {
  const existing = await db.query.userGoals.findFirst({
    where: and(
      eq(table.userGoals.id, goalId),
      eq(table.userGoals.userId, userId),
    ),
  });
  if (!existing) throw new NotFoundError("Goal not found");

  const rows = await db
    .update(table.userGoals)
    .set({
      ...body,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(table.userGoals.id, goalId), eq(table.userGoals.userId, userId)),
    )
    .returning();

  return rows[0] as (typeof rows)[0];
}

export async function removeGoal(userId: string, goalId: string) {
  const existing = await db.query.userGoals.findFirst({
    where: and(
      eq(table.userGoals.id, goalId),
      eq(table.userGoals.userId, userId),
    ),
  });
  if (!existing) throw new NotFoundError("Goal not found");

  await db
    .delete(table.userGoals)
    .where(
      and(eq(table.userGoals.id, goalId), eq(table.userGoals.userId, userId)),
    );

  return { id: goalId, deleted: true as const };
}

// ── Batch queries (for instructor dashboard) ───────────────

const RECENT_SCORES_LIMIT = 10;
const AT_RISK_AVG_THRESHOLD = 5.0;
const AT_RISK_DEADLINE_DAYS = 30;

export async function getProgressForUsers(userIds: string[]) {
  if (userIds.length === 0) return [];

  const [progressRecords, scores] = await Promise.all([
    db
      .select()
      .from(table.userProgress)
      .where(inArray(table.userProgress.userId, userIds)),
    db
      .select()
      .from(table.userSkillScores)
      .where(inArray(table.userSkillScores.userId, userIds))
      .orderBy(desc(table.userSkillScores.createdAt)),
  ]);

  const scoresByUserSkill = new Map<string, number[]>();
  for (const s of scores) {
    const key = `${s.userId}:${s.skill}`;
    const arr = scoresByUserSkill.get(key);
    if (!arr) {
      scoresByUserSkill.set(key, [s.score]);
    } else if (arr.length < RECENT_SCORES_LIMIT) {
      arr.push(s.score);
    }
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
        const { avg, stdDev } = computeStats(recentScores);
        const trend = computeTrend(recentScores, stdDev);
        const progress = progressByUserSkill.get(key);

        return [
          skill,
          {
            currentLevel:
              progress?.currentLevel ??
              (avg !== null ? (scoreToBand(avg) ?? "A2") : null),
            avg: avg !== null ? Math.round(avg * 10) / 10 : null,
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

export async function getAtRiskLearners(userIds: string[]) {
  if (userIds.length === 0) return [];

  const [progressData, goals] = await Promise.all([
    getProgressForUsers(userIds),
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
        const targetBand = goal.targetBand;
        const targetThreshold =
          BAND_THRESHOLDS[targetBand as keyof typeof BAND_THRESHOLDS];
        const allMeetTarget =
          currentBands.length > 0 &&
          currentBands.every((b) => {
            const bandThreshold =
              BAND_THRESHOLDS[b as keyof typeof BAND_THRESHOLDS];
            return bandThreshold !== undefined && targetThreshold !== undefined
              ? bandThreshold >= targetThreshold
              : false;
          });

        if (!allMeetTarget) {
          const deadlineStr = goal.deadline.slice(0, 10);
          reasons.push(`Behind goal: target ${targetBand} by ${deadlineStr}`);
        }
      }
    }

    return { userId, atRisk: reasons.length > 0, reasons };
  });
}
