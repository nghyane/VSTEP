import type { Actor } from "@common/auth-types";
import { ROLES } from "@common/auth-types";
import { ConflictError } from "@common/errors";
import { assertAccess, assertExists, escapeLike } from "@common/utils";
import { db, paginate, takeFirst, takeFirstOrThrow } from "@db/index";
import { exams } from "@db/schema/exams";
import {
  knowledgePoints,
  questionKnowledgePoints,
} from "@db/schema/knowledge-points";
import { questions } from "@db/schema/questions";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
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
    // Validate all knowledge point IDs exist
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

  // If filtering by knowledgePointId, join the junction table
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
    const baseQuery = db
      .select({
        id: questions.id,
        skill: questions.skill,
        part: questions.part,
        content: questions.content,
        answerKey: questions.answerKey,
        explanation: questions.explanation,
        isActive: questions.isActive,
        createdBy: questions.createdBy,
        createdAt: questions.createdAt,
        updatedAt: questions.updatedAt,
      })
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

    return paginate(baseQuery.$dynamic(), countQuery, query);
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
    const question = await tx
      .insert(questions)
      .values({
        skill: body.skill,
        part: body.part,
        content: body.content,
        answerKey: body.answerKey ?? null,
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
