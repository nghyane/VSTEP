import { assertExists, escapeLike } from "@common/utils";
import { db, paginate, takeFirst, takeFirstOrThrow } from "@db/index";
import { knowledgePoints } from "@db/schema/knowledge-points";
import { and, desc, eq, sql } from "drizzle-orm";
import type {
  KnowledgePointCreateBody,
  KnowledgePointListQuery,
  KnowledgePointUpdateBody,
} from "./schema";

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function find(id: string) {
  return assertExists(
    await db
      .select()
      .from(knowledgePoints)
      .where(eq(knowledgePoints.id, id))
      .limit(1)
      .then(takeFirst),
    "Knowledge point",
  );
}

export async function list(query: KnowledgePointListQuery) {
  const where = and(
    query.category ? eq(knowledgePoints.category, query.category) : undefined,
    query.search
      ? sql`${knowledgePoints.name} ILIKE ${`%${escapeLike(query.search)}%`}`
      : undefined,
  );

  return paginate(
    db
      .select()
      .from(knowledgePoints)
      .where(where)
      .orderBy(desc(knowledgePoints.createdAt))
      .$dynamic(),
    db.$count(knowledgePoints, where),
    query,
  );
}

export async function create(body: KnowledgePointCreateBody) {
  return db
    .insert(knowledgePoints)
    .values({
      category: body.category,
      name: body.name,
    })
    .returning()
    .then(takeFirstOrThrow);
}

export async function update(id: string, body: KnowledgePointUpdateBody) {
  assertExists(
    await db
      .select({ id: knowledgePoints.id })
      .from(knowledgePoints)
      .where(eq(knowledgePoints.id, id))
      .limit(1)
      .then(takeFirst),
    "Knowledge point",
  );

  return db
    .update(knowledgePoints)
    .set({
      ...(body.category !== undefined && { category: body.category }),
      ...(body.name !== undefined && { name: body.name }),
    })
    .where(eq(knowledgePoints.id, id))
    .returning()
    .then(takeFirstOrThrow);
}

export async function remove(id: string) {
  assertExists(
    await db
      .select({ id: knowledgePoints.id })
      .from(knowledgePoints)
      .where(eq(knowledgePoints.id, id))
      .limit(1)
      .then(takeFirst),
    "Knowledge point",
  );

  return db
    .delete(knowledgePoints)
    .where(eq(knowledgePoints.id, id))
    .returning({ id: knowledgePoints.id })
    .then(takeFirstOrThrow);
}
