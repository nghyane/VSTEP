import {
  assertExists,
  assertOwnerOrAdmin,
  escapeLike,
  now,
} from "@common/utils";
import { and, count, desc, eq, type SQL, sql } from "drizzle-orm";
import type { Question } from "@/db";
import { db, notDeleted, pagination, table } from "@/db";
import { BadRequestError, ForbiddenError } from "@/plugins/error";

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

export class QuestionService {
  static async getById(questionId: string) {
    const question = await db.query.questions.findFirst({
      where: and(
        eq(table.questions.id, questionId),
        notDeleted(table.questions),
      ),
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

  static async list(
    query: {
      page?: number;
      limit?: number;
      skill?: Question["skill"];
      level?: Question["level"];
      format?: Question["format"];
      isActive?: boolean;
      search?: string;
    },
    _currentUserId: string,
    isAdmin: boolean,
  ) {
    const pg = pagination(query.page, query.limit);

    // Build where conditions
    const conditions: SQL[] = [notDeleted(table.questions)];

    // Admins see all questions including inactive, regular users only see active
    if (!isAdmin) {
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

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(table.questions)
      .where(whereClause);

    const total = countResult?.count || 0;

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

  static async create(
    userId: string,
    body: {
      skill: Question["skill"];
      level: Question["level"];
      format: Question["format"];
      content: unknown;
      answerKey?: unknown;
    },
  ) {
    // Create question and initial version in transaction
    return await db.transaction(async (tx) => {
      // Create question
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
        .returning();

      const q = assertExists(question, "Question");

      // Create initial version
      await tx.insert(table.questionVersions).values({
        questionId: q.id,
        version: 1,
        content: body.content,
        answerKey: body.answerKey ?? null,
      });

      return q;
    });
  }

  static async update(
    questionId: string,
    userId: string,
    isAdmin: boolean,
    body: {
      skill?: Question["skill"];
      level?: Question["level"];
      format?: Question["format"];
      content?: unknown;
      answerKey?: unknown;
      isActive?: boolean;
    },
  ) {
    return await db.transaction(async (tx) => {
      // Get question
      const [row] = await tx
        .select()
        .from(table.questions)
        .where(
          and(eq(table.questions.id, questionId), notDeleted(table.questions)),
        )
        .limit(1);

      const question = assertExists(row, "Question");

      // Check ownership for non-admin
      assertOwnerOrAdmin(
        question.createdBy ?? "",
        userId,
        isAdmin,
        "You can only update your own questions",
      );

      // Build update values
      const updateValues: Partial<typeof table.questions.$inferInsert> = {
        updatedAt: now(),
      };

      if (body.skill !== undefined) updateValues.skill = body.skill;
      if (body.level !== undefined) updateValues.level = body.level;
      if (body.format !== undefined) updateValues.format = body.format;
      if (body.content !== undefined) updateValues.content = body.content;
      if (body.answerKey !== undefined) updateValues.answerKey = body.answerKey;
      if (body.isActive !== undefined) updateValues.isActive = body.isActive;

      // Bump version + create version record when content or answerKey changes
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
        .returning();

      return assertExists(updatedQuestion, "Question");
    });
  }

  static async createVersion(
    questionId: string,
    userId: string,
    isAdmin: boolean,
    body: {
      content: unknown;
      answerKey?: unknown;
    },
  ) {
    return await db.transaction(async (tx) => {
      // Get question
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

      // Check ownership for non-admin
      assertOwnerOrAdmin(
        question.createdBy ?? "",
        userId,
        isAdmin,
        "You can only create versions of your own questions",
      );

      const newVersion = question.version + 1;

      // Create new version record
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

      // Update question with new content and version
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

  static async getVersions(questionId: string) {
    // Verify question exists
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

    // Get all versions
    const versions = await db
      .select()
      .from(table.questionVersions)
      .where(eq(table.questionVersions.questionId, questionId))
      .orderBy(desc(table.questionVersions.version));

    return {
      data: versions,
      meta: {
        total: versions.length,
      },
    };
  }

  static async getVersion(questionId: string, versionId: string) {
    // Verify parent question exists and is not soft-deleted
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

  static async remove(questionId: string, userId: string, isAdmin: boolean) {
    return await db.transaction(async (tx) => {
      // Get question
      const [row] = await tx
        .select()
        .from(table.questions)
        .where(
          and(eq(table.questions.id, questionId), notDeleted(table.questions)),
        )
        .limit(1);

      const question = assertExists(row, "Question");

      // Check ownership for non-admin
      assertOwnerOrAdmin(
        question.createdBy ?? "",
        userId,
        isAdmin,
        "You can only delete your own questions",
      );

      // Soft delete
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

  static async restore(questionId: string, _userId: string, isAdmin: boolean) {
    if (!isAdmin) {
      throw new ForbiddenError("Only admins can restore questions");
    }

    return await db.transaction(async (tx) => {
      // Get deleted question
      const [row] = await tx
        .select()
        .from(table.questions)
        .where(eq(table.questions.id, questionId))
        .limit(1);

      const question = assertExists(row, "Question");

      if (!question.deletedAt) {
        throw new BadRequestError("Question is not deleted");
      }

      // Restore question
      const [updatedQuestion] = await tx
        .update(table.questions)
        .set({
          deletedAt: null,
          updatedAt: now(),
        })
        .where(eq(table.questions.id, questionId))
        .returning();

      return assertExists(updatedQuestion, "Question");
    });
  }
}
