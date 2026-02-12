import type { Actor } from "@common/auth-types";
import { ROLES } from "@common/auth-types";
import { BadRequestError } from "@common/errors";
import { assertAccess, assertExists, escapeLike } from "@common/utils";
import { db, notDeleted, paginated, table } from "@db/index";
import { and, count, desc, eq, type SQL, sql } from "drizzle-orm";
import type {
  QuestionCreateBody,
  QuestionListQuery,
  QuestionUpdateBody,
} from "./schema";
import { QUESTION_COLUMNS } from "./schema";

export async function getQuestionById(questionId: string) {
  const question = await db.query.questions.findFirst({
    where: and(eq(table.questions.id, questionId), notDeleted(table.questions)),
    columns: { answerKey: false, deletedAt: false },
  });

  return assertExists(question, "Question");
}

export async function listQuestions(query: QuestionListQuery, actor: Actor) {
  const admin = actor.is(ROLES.ADMIN);
  const where = and(
    ...[
      notDeleted(table.questions),
      !admin && eq(table.questions.isActive, true),
      admin &&
        query.isActive !== undefined &&
        eq(table.questions.isActive, query.isActive),
      query.skill && eq(table.questions.skill, query.skill),
      query.level && eq(table.questions.level, query.level),
      query.format && eq(table.questions.format, query.format),
      query.search &&
        sql`${table.questions.content}::text ILIKE ${`%${escapeLike(query.search)}%`}`,
    ].filter((c): c is SQL => Boolean(c)),
  );

  const pg = paginated(query.page, query.limit);
  return pg.resolve({
    count: db
      .select({ count: count() })
      .from(table.questions)
      .where(where)
      .then((r) => r[0]?.count ?? 0),
    query: db
      .select(QUESTION_COLUMNS)
      .from(table.questions)
      .where(where)
      .orderBy(desc(table.questions.createdAt))
      .limit(pg.limit)
      .offset(pg.offset),
  });
}

export async function createQuestion(userId: string, body: QuestionCreateBody) {
  return db.transaction(async (tx) => {
    const [question] = await tx
      .insert(table.questions)
      .values({
        skill: body.skill,
        level: body.level,
        format: body.format,
        content: body.content,
        answerKey: body.answerKey ?? null,
        version: 1,
        isActive: true,
        createdBy: userId,
      })
      .returning(QUESTION_COLUMNS);

    const q = assertExists(question, "Question");

    await tx.insert(table.questionVersions).values({
      questionId: q.id,
      version: 1,
      content: body.content,
      answerKey: body.answerKey ?? null,
    });

    return q;
  });
}

export async function updateQuestion(
  questionId: string,
  body: QuestionUpdateBody,
  actor: Actor,
) {
  return db.transaction(async (tx) => {
    const question = assertExists(
      await tx.query.questions.findFirst({
        where: and(
          eq(table.questions.id, questionId),
          notDeleted(table.questions),
        ),
        columns: {
          id: true,
          createdBy: true,
          content: true,
          answerKey: true,
          version: true,
        },
      }),
      "Question",
    );

    assertAccess(
      question.createdBy,
      actor,
      "You can only update your own questions",
    );

    // Bump version whenever content or answerKey is touched — simple and predictable
    const contentChanged =
      body.content !== undefined || body.answerKey !== undefined;
    const nextVersion = contentChanged ? question.version + 1 : undefined;

    if (nextVersion) {
      await tx.insert(table.questionVersions).values({
        questionId,
        version: nextVersion,
        content: body.content ?? question.content,
        answerKey:
          body.answerKey !== undefined ? body.answerKey : question.answerKey,
      });
    }

    const [updated] = await tx
      .update(table.questions)
      .set({
        updatedAt: new Date().toISOString(),
        ...(body.skill !== undefined && { skill: body.skill }),
        ...(body.level !== undefined && { level: body.level }),
        ...(body.format !== undefined && { format: body.format }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.answerKey !== undefined && { answerKey: body.answerKey }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(nextVersion && { version: nextVersion }),
      })
      .where(eq(table.questions.id, questionId))
      .returning(QUESTION_COLUMNS);

    return assertExists(updated, "Question");
  });
}

export async function removeQuestion(questionId: string, actor: Actor) {
  return db.transaction(async (tx) => {
    const question = assertExists(
      await tx.query.questions.findFirst({
        where: and(
          eq(table.questions.id, questionId),
          notDeleted(table.questions),
        ),
        columns: { id: true, createdBy: true },
      }),
      "Question",
    );

    assertAccess(
      question.createdBy,
      actor,
      "You can only delete your own questions",
    );

    const ts = new Date().toISOString();
    const [deleted] = await tx
      .update(table.questions)
      .set({ deletedAt: ts, updatedAt: ts })
      .where(eq(table.questions.id, questionId))
      .returning({
        id: table.questions.id,
        deletedAt: table.questions.deletedAt,
      });

    const removed = assertExists(deleted, "Question");
    return { id: removed.id, deletedAt: removed.deletedAt ?? ts };
  });
}

export async function restoreQuestion(questionId: string) {
  return db.transaction(async (tx) => {
    const question = assertExists(
      await tx.query.questions.findFirst({
        where: eq(table.questions.id, questionId),
        columns: { id: true, deletedAt: true },
      }),
      "Question",
    );

    if (!question.deletedAt) {
      throw new BadRequestError("Question is not deleted");
    }

    const [updated] = await tx
      .update(table.questions)
      .set({ deletedAt: null, updatedAt: new Date().toISOString() })
      .where(eq(table.questions.id, questionId))
      .returning(QUESTION_COLUMNS);

    return assertExists(updated, "Question");
  });
}
