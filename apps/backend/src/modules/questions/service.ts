import { assertExists } from "@common/utils";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db, notDeleted, paginate, paginationMeta, table } from "@/db";
import type { Question } from "@/db";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/plugins/error";

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

export abstract class QuestionService {
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

    if (!question) {
      throw new NotFoundError("Question not found");
    }

    return question;
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
    const { limit, offset } = paginate(query.page, query.limit);

    // Build where conditions
    const conditions: ReturnType<typeof and>[] = [notDeleted(table.questions)];

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
        sql`${table.questions.content}::text ILIKE ${`%${query.search}%`}`,
      );
    }

    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0];

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
      .limit(limit)
      .offset(offset);

    return {
      data: questions,
      meta: paginationMeta(total, query.page, query.limit),
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
      const [question] = await tx
        .select()
        .from(table.questions)
        .where(
          and(eq(table.questions.id, questionId), notDeleted(table.questions)),
        )
        .limit(1);

      if (!question) {
        throw new NotFoundError("Question not found");
      }

      // Check ownership for non-admin
      if (question.createdBy !== userId && !isAdmin) {
        throw new ForbiddenError("You can only update your own questions");
      }

      // Build update values
      const updateValues: Partial<typeof table.questions.$inferInsert> = {
        updatedAt: new Date().toISOString(),
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
      const [question] = await tx
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

      if (!question) {
        throw new NotFoundError("Question not found");
      }

      // Check ownership for non-admin
      if (question.createdBy !== userId && !isAdmin) {
        throw new ForbiddenError(
          "You can only create versions of your own questions",
        );
      }

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
          updatedAt: new Date().toISOString(),
        })
        .where(eq(table.questions.id, questionId));

      return v;
    });
  }

  static async getVersions(questionId: string) {
    // Verify question exists
    const question = await db.query.questions.findFirst({
      where: and(
        eq(table.questions.id, questionId),
        notDeleted(table.questions),
      ),
      columns: { id: true },
    });

    if (!question) {
      throw new NotFoundError("Question not found");
    }

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
    const question = await db.query.questions.findFirst({
      where: and(
        eq(table.questions.id, questionId),
        notDeleted(table.questions),
      ),
      columns: { id: true },
    });

    if (!question) {
      throw new NotFoundError("Question not found");
    }

    const version = await db.query.questionVersions.findFirst({
      where: and(
        eq(table.questionVersions.id, versionId),
        eq(table.questionVersions.questionId, questionId),
      ),
    });

    if (!version) {
      throw new NotFoundError("Question version not found");
    }

    return version;
  }

  static async remove(questionId: string, userId: string, isAdmin: boolean) {
    return await db.transaction(async (tx) => {
      // Get question
      const [question] = await tx
        .select()
        .from(table.questions)
        .where(
          and(eq(table.questions.id, questionId), notDeleted(table.questions)),
        )
        .limit(1);

      if (!question) {
        throw new NotFoundError("Question not found");
      }

      // Check ownership for non-admin
      if (question.createdBy !== userId && !isAdmin) {
        throw new ForbiddenError("You can only delete your own questions");
      }

      // Soft delete
      await tx
        .update(table.questions)
        .set({
          deletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
      const [question] = await tx
        .select()
        .from(table.questions)
        .where(eq(table.questions.id, questionId))
        .limit(1);

      if (!question) {
        throw new NotFoundError("Question not found");
      }

      if (!question.deletedAt) {
        throw new BadRequestError("Question is not deleted");
      }

      // Restore question
      const [updatedQuestion] = await tx
        .update(table.questions)
        .set({
          deletedAt: null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(table.questions.id, questionId))
        .returning();

      return assertExists(updatedQuestion, "Question");
    });
  }
}
