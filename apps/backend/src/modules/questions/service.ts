import { assertAccess, assertExists, escapeLike, now } from "@common/utils";
import { and, count, desc, eq, type SQL, sql } from "drizzle-orm";
import type { Question } from "@/db";
import { db, notDeleted, pagination, table } from "@/db";
import type { Actor } from "@/plugins/auth";
import { BadRequestError } from "@/plugins/error";

const QUESTION_PUBLIC_COLUMNS = {
  id: table.questions.id,
  skill: table.questions.skill,
  level: table.questions.level,
  format: table.questions.format,
  content: table.questions.content,
  version: table.questions.version,
  isActive: table.questions.isActive,
  createdBy: table.questions.createdBy,
  createdAt: table.questions.createdAt,
  updatedAt: table.questions.updatedAt,
  deletedAt: table.questions.deletedAt,
} as const;

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

export async function listQuestions(
  query: {
    page?: number;
    limit?: number;
    skill?: Question["skill"];
    level?: Question["level"];
    format?: Question["format"];
    isActive?: boolean;
    search?: string;
  },
  actor: Actor,
) {
  const pg = pagination(query.page, query.limit);

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

  const [countResult] = await db
    .select({ count: count() })
    .from(table.questions)
    .where(whereClause);

  const total = countResult?.count ?? 0;

  const questions = await db
    .select(QUESTION_PUBLIC_COLUMNS)
    .from(table.questions)
    .where(whereClause)
    .orderBy(desc(table.questions.createdAt))
    .limit(pg.limit)
    .offset(pg.offset);

  return {
    data: questions,
    meta: pg.meta(total),
  };
}

export async function createQuestion(
  userId: string,
  body: {
    skill: Question["skill"];
    level: Question["level"];
    format: Question["format"];
    content: unknown;
    answerKey?: unknown;
  },
) {
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
  actor: Actor,
  body: {
    skill?: Question["skill"];
    level?: Question["level"];
    format?: Question["format"];
    content?: unknown;
    answerKey?: unknown;
    isActive?: boolean;
  },
) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(table.questions)
      .where(
        and(eq(table.questions.id, questionId), notDeleted(table.questions)),
      )
      .limit(1);

    const question = assertExists(row, "Question");

    assertAccess(
      question.createdBy ?? "",
      actor,
      "You can only update your own questions",
    );

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
      body.content !== undefined || body.answerKey !== undefined;
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
  actor: Actor,
  body: {
    content: unknown;
    answerKey?: unknown;
  },
) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        id: table.questions.id,
        version: table.questions.version,
        createdBy: table.questions.createdBy,
      })
      .from(table.questions)
      .where(
        and(eq(table.questions.id, questionId), notDeleted(table.questions)),
      )
      .limit(1);

    const question = assertExists(row, "Question");

    assertAccess(
      question.createdBy ?? "",
      actor,
      "You can only create versions of your own questions",
    );

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
    const [row] = await tx
      .select()
      .from(table.questions)
      .where(
        and(eq(table.questions.id, questionId), notDeleted(table.questions)),
      )
      .limit(1);

    const question = assertExists(row, "Question");

    assertAccess(
      question.createdBy ?? "",
      actor,
      "You can only delete your own questions",
    );

    const timestamp = now();
    await tx
      .update(table.questions)
      .set({
        deletedAt: timestamp,
        updatedAt: timestamp,
      })
      .where(eq(table.questions.id, questionId));

    return { id: questionId };
  });
}

export async function restoreQuestion(questionId: string) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(table.questions)
      .where(eq(table.questions.id, questionId))
      .limit(1);

    const question = assertExists(row, "Question");

    if (!question.deletedAt) {
      throw new BadRequestError("Question is not deleted");
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
