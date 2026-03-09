import type { QuestionLevel } from "@common/scoring";
import { db, table, takeFirst } from "@db/index";
import type { Skill } from "@db/schema/enums";
import { and, desc, eq, inArray, not, sql } from "drizzle-orm";
import type { PracticeNextQuery } from "./schema";

const LEVEL_ORDER = ["A2", "B1", "B2", "C1"] as const;

export async function next(userId: string, query: PracticeNextQuery) {
  const { skill, part } = query;

  const [progress, weakKpIds, recentQuestionIds] = await Promise.all([
    db
      .select({
        currentLevel: table.userProgress.currentLevel,
        scaffoldLevel: table.userProgress.scaffoldLevel,
      })
      .from(table.userProgress)
      .where(
        and(
          eq(table.userProgress.userId, userId),
          eq(table.userProgress.skill, skill),
        ),
      )
      .then(takeFirst),
    db
      .selectDistinct({ id: table.userKnowledgeProgress.knowledgePointId })
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
          eq(table.knowledgePoints.category, "topic"),
          eq(table.questions.skill, skill),
        ),
      )
      .orderBy(table.userKnowledgeProgress.masteryScore)
      .limit(5)
      .then((rows) => rows.map((r) => r.id)),
    db
      .select({ questionId: table.submissions.questionId })
      .from(table.submissions)
      .where(
        and(
          eq(table.submissions.userId, userId),
          eq(table.submissions.skill, skill),
        ),
      )
      .orderBy(desc(table.submissions.createdAt))
      .limit(20)
      .then((rows) => rows.map((r) => r.questionId)),
  ]);

  const currentLevel = progress?.currentLevel ?? "A2";
  const scaffoldLevel = progress?.scaffoldLevel ?? 1;

  const levelIndex = LEVEL_ORDER.indexOf(
    currentLevel as (typeof LEVEL_ORDER)[number],
  );
  const levelsToTry = [
    currentLevel,
    ...(levelIndex > 0 ? [LEVEL_ORDER[levelIndex - 1]] : []),
    ...(levelIndex < LEVEL_ORDER.length - 1
      ? [LEVEL_ORDER[levelIndex + 1]]
      : []),
  ];

  for (const level of levelsToTry) {
    const question = await findQuestion(
      skill,
      level as QuestionLevel,
      part,
      weakKpIds,
      recentQuestionIds,
    );
    if (question) {
      return { question, scaffoldLevel, currentLevel };
    }
  }

  return { question: null, scaffoldLevel, currentLevel };
}

async function findQuestion(
  skill: Skill,
  level: QuestionLevel,
  part: number | undefined,
  weakKpIds: string[],
  excludeIds: string[],
) {
  const conditions = [
    eq(table.questions.skill, skill),
    eq(table.questions.isActive, true),
    eq(table.questions.level, level),
  ];

  if (part !== undefined) {
    conditions.push(eq(table.questions.part, part));
  }

  if (excludeIds.length > 0) {
    conditions.push(not(inArray(table.questions.id, excludeIds)));
  }

  if (weakKpIds.length > 0) {
    const weakQuestion = await db
      .select({
        id: table.questions.id,
        skill: table.questions.skill,
        level: table.questions.level,
        part: table.questions.part,
        content: table.questions.content,
        answerKey: table.questions.answerKey,
        explanation: table.questions.explanation,
      })
      .from(table.questions)
      .innerJoin(
        table.questionKnowledgePoints,
        eq(table.questions.id, table.questionKnowledgePoints.questionId),
      )
      .where(
        and(
          ...conditions,
          inArray(table.questionKnowledgePoints.knowledgePointId, weakKpIds),
        ),
      )
      .orderBy(sql`random()`)
      .limit(1)
      .then(takeFirst);

    if (weakQuestion) return weakQuestion;
  }

  return db
    .select({
      id: table.questions.id,
      skill: table.questions.skill,
      level: table.questions.level,
      part: table.questions.part,
      content: table.questions.content,
      answerKey: table.questions.answerKey,
      explanation: table.questions.explanation,
    })
    .from(table.questions)
    .where(and(...conditions))
    .orderBy(sql`random()`)
    .limit(1)
    .then(takeFirst);
}
