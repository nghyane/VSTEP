import { QUESTION_MESSAGES } from "@common/messages";
import { assertAccess, assertExists, escapeLike, now } from "@common/utils";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  type SQL,
  sql,
} from "drizzle-orm";
import {
  db,
  notDeleted,
  omitColumns,
  paginatedList,
  softDelete,
  table,
} from "@/db";
import type { Actor } from "@/plugins/auth";
import { BadRequestError } from "@/plugins/error";
import type {
  QuestionCreateBody,
  QuestionListQuery,
  QuestionUpdateBody,
  QuestionVersionBody,
} from "./model";

const QUESTION_PUBLIC_COLUMNS = omitColumns(getTableColumns(table.questions), [
  "answerKey",
]);

/** Public resource — any authenticated user can view a question. No ownership check needed. */
export async function getQuestionById(questionId: string) {
  const question = await db.query.questions.findFirst({
    where: and(eq(table.questions.id, questionId), notDeleted(table.questions)),
    columns: {
      id: true,
      skill: true,
      level: true,
      format: true,
      content: true,
      version: true,
      isActive: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return assertExists(question, "Question");
}

export async function listQuestions(query: QuestionListQuery, actor: Actor) {
  const conditions: SQL[] = [notDeleted(table.questions)];

  if (!actor.is("admin")) {
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

  return paginatedList({
    page: query.page,
    limit: query.limit,
    getCount: async () => {
      const [result] = await db
        .select({ count: count() })
        .from(table.questions)
        .where(whereClause);
      return result?.count ?? 0;
    },
    getData: ({ limit, offset }) =>
      db
        .select(QUESTION_PUBLIC_COLUMNS)
        .from(table.questions)
        .where(whereClause)
        .orderBy(desc(table.questions.createdAt))
        .limit(limit)
        .offset(offset),
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
      .returning(QUESTION_PUBLIC_COLUMNS);

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
      .returning(QUESTION_PUBLIC_COLUMNS);

    return assertExists(updatedQuestion, "Question");
  });
}

export async function createQuestionVersion(
  questionId: string,
  body: QuestionVersionBody,
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
          version: true,
          createdBy: true,
        },
      }),
      "Question",
    );

    assertAccess(question.createdBy, actor, QUESTION_MESSAGES.versionOwn);

    const newVersion = question.version + 1;

    const [version] = await tx
      .insert(table.questionVersions)
      .values({
        questionId,
        version: newVersion,
        content: body.content,
        answerKey: body.answerKey ?? null,
      })
      .returning();

    const v = assertExists(version, "Version");

    await tx
      .update(table.questions)
      .set({
        content: body.content,
        answerKey: body.answerKey ?? null,
        version: newVersion,
        updatedAt: now(),
      })
      .where(eq(table.questions.id, questionId));

    return v;
  });
}

export async function getQuestionVersions(questionId: string) {
  assertExists(
    await db.query.questions.findFirst({
      where: and(
        eq(table.questions.id, questionId),
        notDeleted(table.questions),
      ),
      columns: { id: true },
    }),
    "Question",
  );

  const versions = await db
    .select()
    .from(table.questionVersions)
    .where(eq(table.questionVersions.questionId, questionId))
    .orderBy(desc(table.questionVersions.version));

  return {
    data: versions,
    meta: { total: versions.length },
  };
}

export async function getQuestionVersion(
  questionId: string,
  versionId: string,
) {
  assertExists(
    await db.query.questions.findFirst({
      where: and(
        eq(table.questions.id, questionId),
        notDeleted(table.questions),
      ),
      columns: { id: true },
    }),
    "Question",
  );

  const version = await db.query.questionVersions.findFirst({
    where: and(
      eq(table.questionVersions.id, versionId),
      eq(table.questionVersions.questionId, questionId),
    ),
  });

  return assertExists(version, "QuestionVersion");
}

export async function removeQuestion(questionId: string, actor: Actor) {
  return db.transaction(async (tx) => {
    return softDelete(tx, {
      entityName: "Question",
      findExisting: async (trx) => {
        const question = assertExists(
          await trx.query.questions.findFirst({
            where: and(
              eq(table.questions.id, questionId),
              notDeleted(table.questions),
            ),
          }),
          "Question",
        );

        assertAccess(question.createdBy, actor, QUESTION_MESSAGES.deleteOwn);
        return question;
      },
      runDelete: async (trx, timestamp) => {
        const [question] = await trx
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

        return question;
      },
    });
  });
}

export async function restoreQuestion(questionId: string) {
  return db.transaction(async (tx) => {
    const question = assertExists(
      await tx.query.questions.findFirst({
        where: eq(table.questions.id, questionId),
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
      .returning(QUESTION_PUBLIC_COLUMNS);

    return assertExists(updatedQuestion, "Question");
  });
}
