import { BadRequestError, ConflictError } from "@common/errors";
import type { QuestionLevel } from "@common/scoring";
import type { DbTransaction } from "@db/index";
import { db, table, takeFirst, takeFirstOrThrow } from "@db/index";
import { SKILLS } from "@db/schema/enums";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { GoalBody, SelfAssessBody, SkipBody } from "./schema";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LEVELS = ["A2", "B1", "B2", "C1"] as const;
const PASS_THRESHOLD = 0.67;
const QUESTIONS_PER_LEVEL = 3;
const BAND_ORDER: Record<string, number> = { A2: 0, B1: 1, B2: 2, C1: 3 };

type Levels = {
  listening: string;
  reading: string;
  writing: string;
  speaking: string;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function status(userId: string) {
  const placement = await db
    .select()
    .from(table.userPlacements)
    .where(eq(table.userPlacements.userId, userId))
    .then(takeFirst);

  const goal = await db
    .select({ id: table.userGoals.id })
    .from(table.userGoals)
    .where(eq(table.userGoals.userId, userId))
    .then(takeFirst);

  if (!placement) {
    return {
      completed: false,
      placement: null,
      hasGoal: !!goal,
      needsVerification: false,
    };
  }

  const levels = {
    listening: placement.listeningLevel,
    reading: placement.readingLevel,
    writing: placement.writingLevel,
    speaking: placement.speakingLevel,
  };

  const minLevel = SKILLS.reduce(
    (min, s) =>
      (BAND_ORDER[levels[s]] ?? 0) < (BAND_ORDER[min] ?? 0) ? levels[s] : min,
    levels.listening,
  );
  const estimatedBand =
    minLevel === "A2" ? null : (minLevel as "B1" | "B2" | "C1");

  return {
    completed: true,
    placement: {
      source: placement.source,
      confidence: placement.confidence,
      levels,
      estimatedBand,
    },
    hasGoal: !!goal,
    needsVerification: placement.source === "self_assess",
  };
}

export async function selfAssess(userId: string, body: SelfAssessBody) {
  await guardNoPlacements(userId);

  const levels: Levels = {
    listening: body.listening,
    reading: body.reading,
    writing: body.writing,
    speaking: body.speaking,
  };

  await db.transaction(async (tx) => {
    await tx.insert(table.userPlacements).values({
      userId,
      status: "completed",
      source: "self_assess",
      confidence: "low",
      listeningLevel: body.listening,
      readingLevel: body.reading,
      writingLevel: body.writing,
      speakingLevel: body.speaking,
      writingSource: "self",
      speakingSource: "self",
    });

    await initProgress(tx, userId, levels, {
      targetBand: body.targetBand,
      deadline: body.deadline,
      dailyStudyTimeMinutes: body.dailyStudyTimeMinutes,
    });
  });

  const minLevel = SKILLS.reduce(
    (min, s) =>
      (BAND_ORDER[levels[s]] ?? 0) < (BAND_ORDER[min] ?? 0) ? levels[s] : min,
    levels.listening,
  );
  const estimatedBand =
    minLevel === "A2" ? null : (minLevel as "B1" | "B2" | "C1");

  return {
    source: "self_assess" as const,
    confidence: "low" as const,
    levels,
    estimatedBand,
    weakPoints: [],
    needsVerification: true,
  };
}

export async function startPlacement(userId: string) {
  await guardNoPlacements(userId);
  return generatePlacementExam(userId);
}

export async function skipWithSurvey(userId: string, body: SkipBody) {
  await guardNoPlacements(userId);

  const level = estimateLevelFromSurvey(body);
  const levels: Levels = {
    listening: level,
    reading: level,
    writing: level,
    speaking: level,
  };

  await db.transaction(async (tx) => {
    await tx.insert(table.userPlacements).values({
      userId,
      status: "skipped",
      source: "skipped",
      confidence: "low",
      listeningLevel: level,
      readingLevel: level,
      writingLevel: level,
      speakingLevel: level,
      writingSource: "estimated",
      speakingSource: "estimated",
    });

    await initProgress(tx, userId, levels, {
      targetBand: body.targetBand,
      deadline: body.deadline,
      dailyStudyTimeMinutes: body.dailyStudyTimeMinutes,
    });
  });

  const estimatedBand = level === "A2" ? null : (level as "B1" | "B2" | "C1");

  return {
    source: "skipped" as const,
    confidence: "low" as const,
    levels,
    estimatedBand,
    weakPoints: [],
    needsVerification: false,
  };
}

// ---------------------------------------------------------------------------
// Placement exam generation
// ---------------------------------------------------------------------------

async function generatePlacementExam(userId: string) {
  return db.transaction(async (tx) => {
    const listeningIds: string[] = [];
    const readingIds: string[] = [];
    for (const skill of ["listening", "reading"] as const) {
      for (const level of LEVELS) {
        const ids = await sampleQuestions(
          tx,
          skill,
          level,
          QUESTIONS_PER_LEVEL,
        );
        if (skill === "listening") listeningIds.push(...ids);
        else readingIds.push(...ids);
      }
    }

    const allQuestionIds = [...listeningIds, ...readingIds];
    if (allQuestionIds.length === 0) {
      throw new BadRequestError(
        "Not enough questions available for placement test",
      );
    }

    const blueprint = {
      listening: { questionIds: listeningIds },
      reading: { questionIds: readingIds },
    };

    const { id: examId } = await tx
      .insert(table.exams)
      .values({
        level: "B1",
        title: "Placement Test",
        description: "Dynamic placement test for onboarding",
        type: "placement",
        durationMinutes: 60,
        blueprint,
        isActive: false,
      })
      .returning({ id: table.exams.id })
      .then(takeFirstOrThrow);

    const { id: sessionId } = await tx
      .insert(table.examSessions)
      .values({
        userId,
        examId,
        status: "in_progress",
        startedAt: new Date().toISOString(),
      })
      .returning({ id: table.examSessions.id })
      .then(takeFirstOrThrow);

    return {
      sessionId,
      examId,
      questionCount: allQuestionIds.length,
    };
  });
}

async function sampleQuestions(
  tx: DbTransaction,
  skill: "listening" | "reading",
  level: "A2" | "B1" | "B2" | "C1",
  count: number,
): Promise<string[]> {
  const rows = await tx
    .select({ id: table.questions.id, part: table.questions.part })
    .from(table.questions)
    .where(
      and(
        eq(table.questions.skill, skill),
        eq(table.questions.level, level),
        eq(table.questions.isActive, true),
      ),
    )
    .orderBy(sql`random()`)
    .limit(count * 3);

  const byPart = new Map<number, string[]>();
  for (const r of rows) {
    const arr = byPart.get(r.part) ?? [];
    arr.push(r.id);
    byPart.set(r.part, arr);
  }

  const picked: string[] = [];
  const parts = [...byPart.keys()].sort();
  let partIdx = 0;
  while (picked.length < count && parts.length > 0) {
    const part = parts[partIdx % parts.length] as number;
    const arr = byPart.get(part);
    if (arr && arr.length > 0) {
      const item = arr.shift();
      if (item) picked.push(item);
    } else {
      parts.splice(partIdx % parts.length, 1);
      if (parts.length === 0) break;
    }
    partIdx++;
  }

  return picked;
}

// ---------------------------------------------------------------------------
// Placement scoring (boundary detection)
// ---------------------------------------------------------------------------

export interface PlacementScoring {
  levels: Levels;
  confidence: "high" | "medium" | "low";
}

export function detectLevel(
  results: { level: string; correct: number; total: number }[],
): { level: string; confidence: "high" | "medium" | "low" } {
  const byLevel = new Map(results.map((r) => [r.level, r]));

  let ceiling = "A2";
  let broken = false;
  let hasSkipPass = false;

  for (const level of LEVELS) {
    const r = byLevel.get(level);
    if (!r || r.total === 0) continue;

    const rate = r.correct / r.total;
    if (rate >= PASS_THRESHOLD) {
      if (broken) {
        // Passed a higher level after failing a lower one — inconsistent
        hasSkipPass = true;
      } else {
        ceiling = level;
      }
    } else {
      broken = true;
    }
  }

  let confidence: "high" | "medium" | "low";
  if (hasSkipPass) {
    confidence = "low";
  } else {
    const ceilingResult = byLevel.get(ceiling);
    if (ceilingResult && ceilingResult.total > 0) {
      const rate = ceilingResult.correct / ceilingResult.total;
      confidence = rate >= 0.8 ? "high" : "medium";
    } else {
      confidence = "medium";
    }
  }

  return { level: ceiling, confidence };
}
// ---------------------------------------------------------------------------
// Finalize placement from exam submission
// ---------------------------------------------------------------------------

export async function finalizePlacementOnboarding(
  tx: DbTransaction,
  userId: string,
  sessionId: string,
) {
  // Fetch answers with question metadata
  const answers = await tx
    .select({
      questionId: table.examAnswers.questionId,
      isCorrect: table.examAnswers.isCorrect,
      skill: table.questions.skill,
      level: table.questions.level,
    })
    .from(table.examAnswers)
    .innerJoin(
      table.questions,
      eq(table.examAnswers.questionId, table.questions.id),
    )
    .where(eq(table.examAnswers.sessionId, sessionId));

  // Group by skill+level
  const skillLevelMap = new Map<
    string,
    Map<string, { correct: number; total: number }>
  >();
  const correctness = new Map<string, boolean>();

  for (const a of answers) {
    correctness.set(a.questionId, a.isCorrect ?? false);

    let levelMap = skillLevelMap.get(a.skill);
    if (!levelMap) {
      levelMap = new Map();
      skillLevelMap.set(a.skill, levelMap);
    }
    const entry = levelMap.get(a.level) ?? { correct: 0, total: 0 };
    entry.total++;
    if (a.isCorrect) entry.correct++;
    levelMap.set(a.level, entry);
  }

  // Detect level per skill
  const levels: Record<string, string> = {};
  let minConfidence: "high" | "medium" | "low" = "high";
  const confidenceOrder = { high: 2, medium: 1, low: 0 };

  for (const skill of SKILLS) {
    const levelMap = skillLevelMap.get(skill);
    if (levelMap) {
      const results = [...levelMap.entries()].map(([level, stats]) => ({
        level,
        correct: stats.correct,
        total: stats.total,
      }));
      const { level, confidence } = detectLevel(results);
      levels[skill] = level;
      if (confidenceOrder[confidence] < confidenceOrder[minConfidence]) {
        minConfidence = confidence;
      }
    } else {
      // No data for this skill (writing/speaking not in placement test)
      levels[skill] = "A2";
    }
  }

  await populateKnowledgeProgress(tx, userId, correctness);

  await tx.insert(table.userPlacements).values({
    userId,
    sessionId,
    status: "completed",
    source: "placement",
    confidence: minConfidence,
    listeningLevel: levels.listening as QuestionLevel,
    readingLevel: levels.reading as QuestionLevel,
    writingLevel: (levels.writing ?? "A2") as QuestionLevel,
    speakingLevel: (levels.speaking ?? "A2") as QuestionLevel,
    writingSource: "estimated",
    speakingSource: "estimated",
  });

  await initProgress(tx, userId, levels as Levels);

  const weakPoints = await getWeakPoints(tx, userId);

  const minLevel = SKILLS.reduce<string>(
    (min, s) =>
      (BAND_ORDER[levels[s] ?? ""] ?? 0) < (BAND_ORDER[min] ?? 0)
        ? (levels[s] ?? min)
        : min,
    levels.listening ?? "A2",
  );
  const estimatedBand =
    minLevel === "A2" ? null : (minLevel as "B1" | "B2" | "C1");

  return {
    source: "placement" as const,
    confidence: minConfidence,
    levels: levels as Levels,
    estimatedBand,
    weakPoints,
    needsVerification: false,
  };
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

export async function initProgress(
  tx: DbTransaction,
  userId: string,
  levels: Levels,
  goalBody?: GoalBody,
) {
  await tx
    .insert(table.userProgress)
    .values(
      SKILLS.map((skill) => ({
        userId,
        skill,
        currentLevel: levels[skill] as QuestionLevel,
        scaffoldLevel: 1,
        streakCount: 0,
        attemptCount: 0,
      })),
    )
    .onConflictDoNothing();

  if (goalBody) {
    const minLevel = SKILLS.reduce(
      (min, s) =>
        (BAND_ORDER[levels[s]] ?? 0) < (BAND_ORDER[min] ?? 0) ? levels[s] : min,
      levels.listening,
    );
    const currentEstimatedBand =
      minLevel === "A2" ? null : (minLevel as "B1" | "B2" | "C1");

    await tx
      .insert(table.userGoals)
      .values({
        userId,
        targetBand: goalBody.targetBand,
        currentEstimatedBand,
        deadline: goalBody.deadline,
        dailyStudyTimeMinutes: goalBody.dailyStudyTimeMinutes ?? 30,
      })
      .onConflictDoNothing();
  }
}

export async function populateKnowledgeProgress(
  tx: DbTransaction,
  userId: string,
  correctness: Map<string, boolean>,
) {
  if (correctness.size === 0) return;

  const qIds = [...correctness.keys()];
  const links = await tx
    .select({
      questionId: table.questionKnowledgePoints.questionId,
      knowledgePointId: table.questionKnowledgePoints.knowledgePointId,
    })
    .from(table.questionKnowledgePoints)
    .where(inArray(table.questionKnowledgePoints.questionId, qIds));

  if (links.length === 0) return;

  const kpMap = new Map<string, { attempted: number; correct: number }>();
  for (const link of links) {
    const isCorrect = correctness.get(link.questionId) ?? false;
    const entry = kpMap.get(link.knowledgePointId) ?? {
      attempted: 0,
      correct: 0,
    };
    entry.attempted++;
    if (isCorrect) entry.correct++;
    kpMap.set(link.knowledgePointId, entry);
  }

  for (const [kpId, stats] of kpMap) {
    const mastery =
      stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0;
    await tx
      .insert(table.userKnowledgeProgress)
      .values({
        userId,
        knowledgePointId: kpId,
        masteryScore: mastery,
        totalAttempted: stats.attempted,
        totalCorrect: stats.correct,
      })
      .onConflictDoUpdate({
        target: [
          table.userKnowledgeProgress.userId,
          table.userKnowledgeProgress.knowledgePointId,
        ],
        set: {
          masteryScore: sql`(${table.userKnowledgeProgress.totalCorrect} + ${stats.correct})::numeric / (${table.userKnowledgeProgress.totalAttempted} + ${stats.attempted})::numeric * 100`,
          totalAttempted: sql`${table.userKnowledgeProgress.totalAttempted} + ${stats.attempted}`,
          totalCorrect: sql`${table.userKnowledgeProgress.totalCorrect} + ${stats.correct}`,
          updatedAt: new Date().toISOString(),
        },
      });
  }
}

export async function getWeakPoints(tx: DbTransaction, userId: string) {
  const rows = await tx
    .select({
      skill: table.questions.skill,
      category: table.knowledgePoints.category,
      name: table.knowledgePoints.name,
      masteryScore: table.userKnowledgeProgress.masteryScore,
    })
    .from(table.userKnowledgeProgress)
    .innerJoin(
      table.knowledgePoints,
      eq(
        table.userKnowledgeProgress.knowledgePointId,
        table.knowledgePoints.id,
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
    .where(
      and(
        eq(table.userKnowledgeProgress.userId, userId),
        sql`${table.userKnowledgeProgress.masteryScore} < 60`,
      ),
    )
    .groupBy(
      table.questions.skill,
      table.knowledgePoints.category,
      table.knowledgePoints.name,
      table.userKnowledgeProgress.masteryScore,
    )
    .orderBy(table.userKnowledgeProgress.masteryScore)
    .limit(10);

  return rows.map((r) => ({
    skill: r.skill,
    category: r.category,
    name: r.name,
  }));
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function guardNoPlacements(userId: string) {
  const existing = await db
    .select({ id: table.userPlacements.id })
    .from(table.userPlacements)
    .where(eq(table.userPlacements.userId, userId))
    .then(takeFirst);

  if (existing) {
    throw new ConflictError("Onboarding already completed");
  }
}

function estimateLevelFromSurvey(body: SkipBody): QuestionLevel {
  if (body.previousTest === "ielts" && body.previousScore) {
    const score = parseFloat(body.previousScore);
    if (!Number.isNaN(score)) {
      if (score >= 6.5) return "C1";
      if (score >= 5.0) return "B2";
      if (score >= 4.0) return "B1";
      return "A2";
    }
  }
  if (body.previousTest === "toeic" && body.previousScore) {
    const score = parseInt(body.previousScore, 10);
    if (!Number.isNaN(score)) {
      if (score >= 785) return "C1";
      if (score >= 550) return "B2";
      if (score >= 400) return "B1";
      return "A2";
    }
  }
  if (body.previousTest === "vstep" && body.previousScore) {
    if (
      (["C1", "B2", "B1"] as const).includes(
        body.previousScore as "C1" | "B2" | "B1",
      )
    ) {
      return body.previousScore as QuestionLevel;
    }
  }
  if (body.englishYears !== undefined) {
    if (body.englishYears >= 10) return "B2";
    if (body.englishYears >= 6) return "B1";
    return "A2";
  }
  const TARGET_TO_START: Record<string, QuestionLevel> = {
    C1: "B2",
    B2: "B1",
    B1: "A2",
  };
  return TARGET_TO_START[body.targetBand] ?? "A2";
}
