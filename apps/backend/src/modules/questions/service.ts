import type { Actor } from "@common/auth-types";
import { ROLES } from "@common/auth-types";
import { BadRequestError, ConflictError } from "@common/errors";
import { assertAccess, assertExists, escapeLike } from "@common/utils";
import { db, paginate, takeFirst, takeFirstOrThrow } from "@db/index";
import type { Skill } from "@db/schema/enums";
import { exams } from "@db/schema/exams";
import {
  knowledgePoints,
  questionKnowledgePoints,
} from "@db/schema/knowledge-points";
import { questions } from "@db/schema/questions";
import type { ObjectiveAnswerKey } from "@db/types/answers";
import {
  CONTENT_MAP,
  OBJECTIVE_SKILLS,
  type QuestionContent,
  VALID_PARTS,
} from "@db/types/question-content";
import { Value } from "@sinclair/typebox/value";
import { and, desc, eq, getTableColumns, inArray, sql } from "drizzle-orm";
import type {
  QuestionCreateBody,
  QuestionListQuery,
  QuestionUpdateBody,
} from "./schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function syncKnowledgePoints(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  questionId: string,
  knowledgePointIds: string[],
) {
  await tx
    .delete(questionKnowledgePoints)
    .where(eq(questionKnowledgePoints.questionId, questionId));

  if (knowledgePointIds.length > 0) {
    const existing = await tx
      .select({ id: knowledgePoints.id })
      .from(knowledgePoints)
      .where(inArray(knowledgePoints.id, knowledgePointIds));

    if (existing.length !== knowledgePointIds.length) {
      const found = new Set(existing.map((r) => r.id));
      const missing = knowledgePointIds.filter((id) => !found.has(id));
      throw new ConflictError(
        `Knowledge points not found: ${missing.join(", ")}`,
      );
    }

    await tx.insert(questionKnowledgePoints).values(
      knowledgePointIds.map((kpId) => ({
        questionId,
        knowledgePointId: kpId,
      })),
    );
  }
}

async function getKnowledgePointIds(questionId: string) {
  const rows = await db
    .select({ knowledgePointId: questionKnowledgePoints.knowledgePointId })
    .from(questionKnowledgePoints)
    .where(eq(questionKnowledgePoints.questionId, questionId));
  return rows.map((r) => r.knowledgePointId);
}

function validateQuestion(
  skill: Skill,
  part: number,
  content: QuestionContent,
  answerKey: ObjectiveAnswerKey | null,
) {
  const validParts: readonly number[] = VALID_PARTS[skill];
  if (!validParts.includes(part))
    throw new BadRequestError(
      `Invalid part ${part} for ${skill} (valid: ${validParts.join(", ")})`,
    );

  const schema = CONTENT_MAP[`${skill}:${part}`];
  if (!schema || !Value.Check(schema, content))
    throw new BadRequestError(
      `Content does not match expected schema for ${skill} part ${part}`,
    );

  if (OBJECTIVE_SKILLS.has(skill) && !answerKey)
    throw new BadRequestError(`answerKey is required for ${skill} questions`);

  if (!OBJECTIVE_SKILLS.has(skill) && answerKey)
    throw new BadRequestError(
      `answerKey must not be set for ${skill} questions`,
    );
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function find(questionId: string) {
  const question = assertExists(
    await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1)
      .then(takeFirst),
    "Question",
  );
  const knowledgePointIds = await getKnowledgePointIds(questionId);
  return { ...question, knowledgePointIds };
}

export async function list(query: QuestionListQuery, actor: Actor) {
  const admin = actor.is(ROLES.ADMIN);

  const hasKpFilter = query.knowledgePointId !== undefined;

  const where = and(
    !admin ? eq(questions.isActive, true) : undefined,
    admin && query.isActive !== undefined
      ? eq(questions.isActive, query.isActive)
      : undefined,
    query.skill ? eq(questions.skill, query.skill) : undefined,
    query.part ? eq(questions.part, query.part) : undefined,
    hasKpFilter
      ? eq(
          questionKnowledgePoints.knowledgePointId,
          query.knowledgePointId as string,
        )
      : undefined,
    query.search
      ? sql`${questions.content}::text ILIKE ${`%${escapeLike(query.search)}%`}`
      : undefined,
  );

  if (hasKpFilter) {
    const kpJoin = db
      .select(getTableColumns(questions))
      .from(questions)
      .innerJoin(
        questionKnowledgePoints,
        eq(questions.id, questionKnowledgePoints.questionId),
      )
      .where(where)
      .orderBy(desc(questions.createdAt));

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(questions)
      .innerJoin(
        questionKnowledgePoints,
        eq(questions.id, questionKnowledgePoints.questionId),
      )
      .where(where)
      .then((r) => Number(r[0]?.count ?? 0));

    return paginate(kpJoin.$dynamic(), countQuery, query);
  }

  return paginate(
    db
      .select()
      .from(questions)
      .where(where)
      .orderBy(desc(questions.createdAt))
      .$dynamic(),
    db.$count(questions, where),
    query,
  );
}

export async function create(userId: string, body: QuestionCreateBody) {
  return db.transaction(async (tx) => {
    const answerKey = "answerKey" in body ? body.answerKey : null;

    const question = await tx
      .insert(questions)
      .values({
        skill: body.skill,
        part: body.part,
        content: body.content,
        answerKey,
        explanation: body.explanation ?? null,
        isActive: true,
        createdBy: userId,
      })
      .returning()
      .then(takeFirstOrThrow);

    const knowledgePointIds = body.knowledgePointIds ?? [];
    if (knowledgePointIds.length > 0) {
      await syncKnowledgePoints(tx, question.id, knowledgePointIds);
    }

    return { ...question, knowledgePointIds };
  });
}

export async function update(
  questionId: string,
  body: QuestionUpdateBody,
  actor: Actor,
) {
  return db.transaction(async (tx) => {
    const existing = assertExists(
      await tx
        .select()
        .from(questions)
        .where(eq(questions.id, questionId))
        .limit(1)
        .then(takeFirst),
      "Question",
    );

    assertAccess(
      existing.createdBy,
      actor,
      "You can only update your own questions",
    );

    const mergedSkill = existing.skill;
    const mergedPart = body.part ?? existing.part;
    const mergedContent = body.content ?? existing.content;
    const mergedAnswerKey =
      body.answerKey !== undefined ? body.answerKey : existing.answerKey;
    validateQuestion(mergedSkill, mergedPart, mergedContent, mergedAnswerKey);

    const updated = await tx
      .update(questions)
      .set({
        ...(body.part !== undefined && { part: body.part }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.answerKey !== undefined && { answerKey: body.answerKey }),
        ...(body.explanation !== undefined && {
          explanation: body.explanation,
        }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      })
      .where(eq(questions.id, questionId))
      .returning()
      .then(takeFirstOrThrow);

    if (body.knowledgePointIds !== undefined) {
      await syncKnowledgePoints(tx, questionId, body.knowledgePointIds);
    }

    const knowledgePointIds =
      body.knowledgePointIds ?? (await getKnowledgePointIds(questionId));

    return { ...updated, knowledgePointIds };
  });
}

export async function remove(questionId: string) {
  return db.transaction(async (tx) => {
    assertExists(
      await tx
        .select({ id: questions.id })
        .from(questions)
        .where(eq(questions.id, questionId))
        .limit(1)
        .then(takeFirst),
      "Question",
    );

    const referencingExams = await tx
      .select({ id: exams.id })
      .from(exams)
      .where(
        and(
          eq(exams.isActive, true),
          sql`(
            ${exams.blueprint}->'listening'->'questionIds' @> ${JSON.stringify([questionId])}::jsonb OR
            ${exams.blueprint}->'reading'->'questionIds' @> ${JSON.stringify([questionId])}::jsonb OR
            ${exams.blueprint}->'writing'->'questionIds' @> ${JSON.stringify([questionId])}::jsonb OR
            ${exams.blueprint}->'speaking'->'questionIds' @> ${JSON.stringify([questionId])}::jsonb
          )`,
        ),
      )
      .limit(1);

    if (referencingExams.length > 0) {
      throw new ConflictError(
        "Cannot delete question referenced by active exams",
      );
    }

    return tx
      .delete(questions)
      .where(eq(questions.id, questionId))
      .returning({ id: questions.id })
      .then(takeFirstOrThrow);
  });
}
