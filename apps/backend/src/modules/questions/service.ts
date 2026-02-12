import type { Actor } from "@common/auth-types";
import { ROLES } from "@common/auth-types";
import { BadRequestError } from "@common/errors";
import { assertAccess, assertExists, escapeLike, now } from "@common/utils";
import { db, notDeleted, table } from "@db/index";
import { paginatedQuery } from "@db/repos";
import { questionView } from "@db/views";
import { and, count, desc, eq, type SQL, sql } from "drizzle-orm";
import { QUESTION_MESSAGES } from "./messages";
import type {
  QuestionCreateBody,
  QuestionListQuery,
  QuestionUpdateBody,
} from "./schema";

export async function getQuestionById(questionId: string) {
  const question = await db.query.questions.findFirst({
    where: and(eq(table.questions.id, questionId), notDeleted(table.questions)),
    columns: questionView.queryColumns,
  });

  return assertExists(question, "Question");
}

export async function listQuestions(query: QuestionListQuery, actor: Actor) {
  const conditions: SQL[] = [notDeleted(table.questions)];

  if (!actor.is(ROLES.ADMIN)) {
    conditions.push(eq(table.questions.isActive, true));
  } else if (query.isActive !== undefined) {
    conditions.push(eq(table.questions.isActive, query.isActive));
  }

  if (query.skill) {
    conditions.push(eq(table.questions.skill, query.skill));
  }

  if (query.level) {
    conditions.push(eq(table.questions.level, query.level));
  }

  if (query.format) {
    conditions.push(eq(table.questions.format, query.format));
  }

  if (query.search) {
    conditions.push(
      sql`${table.questions.content}::text ILIKE ${`%${escapeLike(query.search)}%`}`,
    );
  }

  const whereClause = and(...conditions);

  const pg = paginatedQuery(query.page, query.limit);
  return pg.resolve({
    count: db
      .select({ count: count() })
      .from(table.questions)
      .where(whereClause)
      .then((result) => result[0]?.count ?? 0),
    query: db
      .select(questionView.columns)
      .from(table.questions)
      .where(whereClause)
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
      .returning(questionView.columns);

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

    assertAccess(question.createdBy, actor, QUESTION_MESSAGES.updateOwn);

    const updateValues: Partial<typeof table.questions.$inferInsert> = {
      updatedAt: now(),
    };

    if (body.skill !== undefined) updateValues.skill = body.skill;
    if (body.level !== undefined) updateValues.level = body.level;
    if (body.format !== undefined) updateValues.format = body.format;
    if (body.content !== undefined) updateValues.content = body.content;
    if (body.answerKey !== undefined) updateValues.answerKey = body.answerKey;
    if (body.isActive !== undefined) updateValues.isActive = body.isActive;

    const contentChanged =
      (body.content !== undefined &&
        JSON.stringify(body.content) !== JSON.stringify(question.content)) ||
      (body.answerKey !== undefined &&
        JSON.stringify(body.answerKey) !== JSON.stringify(question.answerKey));

    if (contentChanged) {
      const newVersion = question.version + 1;
      updateValues.version = newVersion;

      await tx.insert(table.questionVersions).values({
        questionId,
        version: newVersion,
        content: body.content ?? question.content,
        answerKey:
          body.answerKey !== undefined ? body.answerKey : question.answerKey,
      });
    }

    const [updatedQuestion] = await tx
      .update(table.questions)
      .set(updateValues)
      .where(eq(table.questions.id, questionId))
      .returning(questionView.columns);

    return assertExists(updatedQuestion, "Question");
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

    assertAccess(question.createdBy, actor, QUESTION_MESSAGES.deleteOwn);

    const timestamp = now();
    const [deleted] = await tx
      .update(table.questions)
      .set({
        deletedAt: timestamp,
        updatedAt: timestamp,
      })
      .where(eq(table.questions.id, questionId))
      .returning({
        id: table.questions.id,
        deletedAt: table.questions.deletedAt,
      });

    const removed = assertExists(deleted, "Question");
    return { id: removed.id, deletedAt: removed.deletedAt ?? timestamp };
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
      throw new BadRequestError(QUESTION_MESSAGES.notDeleted);
    }

    const [updatedQuestion] = await tx
      .update(table.questions)
      .set({
        deletedAt: null,
        updatedAt: now(),
      })
      .where(eq(table.questions.id, questionId))
      .returning(questionView.columns);

    return assertExists(updatedQuestion, "Question");
  });
}
