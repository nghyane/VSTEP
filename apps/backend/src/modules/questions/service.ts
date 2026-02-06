/**
 * Questions Module Service
 * Business logic for question management
 * @see https://elysiajs.com/pattern/mvc.html
 */

import { assertExists } from "@common/utils";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db, notDeleted, paginate, paginationMeta, table } from "@/db";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/plugins/error";

const mapQuestionResponse = (q: {
  id: string;
  skill: string;
  level: string;
  format: string;
  content: unknown;
  answerKey: unknown;
  version: number;
  isActive: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}) => ({
  id: q.id,
  skill: q.skill,
  level: q.level,
  format: q.format,
  content: q.content,
  answerKey: q.answerKey ?? undefined,
  version: q.version,
  isActive: q.isActive,
  createdBy: q.createdBy ?? undefined,
  createdAt: q.createdAt.toISOString(),
  updatedAt: q.updatedAt.toISOString(),
  deletedAt: q.deletedAt?.toISOString(),
});

const mapVersionResponse = (v: {
  id: string;
  questionId: string;
  version: number;
  content: unknown;
  answerKey: unknown;
  createdAt: Date;
}) => ({
  id: v.id,
  questionId: v.questionId,
  version: v.version,
  content: v.content,
  answerKey: v.answerKey ?? undefined,
  createdAt: v.createdAt.toISOString(),
});

/**
 * Question service with static methods
 */
export abstract class QuestionService {
  /**
   * Get question by ID
   * @throws NotFoundError if question not found
   */
  static async getById(questionId: string) {
    const question = await db.query.questions.findFirst({
      where: and(
        eq(table.questions.id, questionId),
        notDeleted(table.questions),
      ),
    });

    if (!question) {
      throw new NotFoundError("Question not found");
    }

    return mapQuestionResponse(question);
  }

  /**
   * List questions with filtering and pagination
   */
  static async list(
    query: {
      page?: number;
      limit?: number;
      skill?: "listening" | "reading" | "writing" | "speaking";
      level?: "A2" | "B1" | "B2" | "C1";
      format?: string;
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

    // Get questions
    const questions = await db
      .select()
      .from(table.questions)
      .where(whereClause)
      .orderBy(desc(table.questions.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: questions.map((q) => mapQuestionResponse(q)),
      meta: paginationMeta(total, query.page, query.limit),
    };
  }

  /**
   * Create new question
   */
  static async create(
    userId: string,
    body: {
      skill: "listening" | "reading" | "writing" | "speaking";
      level: "A2" | "B1" | "B2" | "C1";
      format: string;
      content: any;
      answerKey?: any;
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
        .returning({
          id: table.questions.id,
          skill: table.questions.skill,
          level: table.questions.level,
          format: table.questions.format,
          content: table.questions.content,
          answerKey: table.questions.answerKey,
          version: table.questions.version,
          isActive: table.questions.isActive,
          createdBy: table.questions.createdBy,
          createdAt: table.questions.createdAt,
          updatedAt: table.questions.updatedAt,
          deletedAt: table.questions.deletedAt,
        });

      const q = assertExists(question, "Question");

      // Create initial version
      await tx.insert(table.questionVersions).values({
        questionId: q.id,
        version: 1,
        content: body.content,
        answerKey: body.answerKey ?? null,
      });

      return mapQuestionResponse(q);
    });
  }

  /**
   * Update question
   * @throws NotFoundError if question not found
   */
  static async update(
    questionId: string,
    userId: string,
    isAdmin: boolean,
    body: {
      skill?: "listening" | "reading" | "writing" | "speaking";
      level?: "A2" | "B1" | "B2" | "C1";
      format?: string;
      content?: any;
      answerKey?: any;
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
        updatedAt: new Date(),
      };

      if (body.skill) updateValues.skill = body.skill;
      if (body.level) updateValues.level = body.level;
      if (body.format) updateValues.format = body.format;
      if (body.content) updateValues.content = body.content;
      if (body.answerKey !== undefined) updateValues.answerKey = body.answerKey;
      if (body.isActive !== undefined) updateValues.isActive = body.isActive;

      // Update question
      const [updatedQuestion] = await tx
        .update(table.questions)
        .set(updateValues)
        .where(eq(table.questions.id, questionId))
        .returning({
          id: table.questions.id,
          skill: table.questions.skill,
          level: table.questions.level,
          format: table.questions.format,
          content: table.questions.content,
          answerKey: table.questions.answerKey,
          version: table.questions.version,
          isActive: table.questions.isActive,
          createdBy: table.questions.createdBy,
          createdAt: table.questions.createdAt,
          updatedAt: table.questions.updatedAt,
          deletedAt: table.questions.deletedAt,
        });

      const q = assertExists(updatedQuestion, "Question");

      return mapQuestionResponse(q);
    });
  }

  /**
   * Create a new version of a question
   * @throws NotFoundError if question not found
   */
  static async createVersion(
    questionId: string,
    userId: string,
    isAdmin: boolean,
    body: {
      content: any;
      answerKey?: any;
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
        .returning({
          id: table.questionVersions.id,
          questionId: table.questionVersions.questionId,
          version: table.questionVersions.version,
          content: table.questionVersions.content,
          answerKey: table.questionVersions.answerKey,
          createdAt: table.questionVersions.createdAt,
        });

      const v = assertExists(version, "Version");

      // Update question with new content and version
      await tx
        .update(table.questions)
        .set({
          content: body.content,
          answerKey: body.answerKey ?? null,
          version: newVersion,
          updatedAt: new Date(),
        })
        .where(eq(table.questions.id, questionId));

      return mapVersionResponse(v);
    });
  }

  /**
   * Get all versions of a question
   * @throws NotFoundError if question not found
   */
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
      .select({
        id: table.questionVersions.id,
        questionId: table.questionVersions.questionId,
        version: table.questionVersions.version,
        content: table.questionVersions.content,
        answerKey: table.questionVersions.answerKey,
        createdAt: table.questionVersions.createdAt,
      })
      .from(table.questionVersions)
      .where(eq(table.questionVersions.questionId, questionId))
      .orderBy(desc(table.questionVersions.version));

    return {
      data: versions.map((v) => mapVersionResponse(v)),
      meta: {
        total: versions.length,
      },
    };
  }

  /**
   * Get a specific version of a question
   * @throws NotFoundError if question or version not found
   */
  static async getVersion(questionId: string, versionId: string) {
    const version = await db.query.questionVersions.findFirst({
      where: and(
        eq(table.questionVersions.id, versionId),
        eq(table.questionVersions.questionId, questionId),
      ),
      columns: {
        id: true,
        questionId: true,
        version: true,
        content: true,
        answerKey: true,
        createdAt: true,
      },
    });

    if (!version) {
      throw new NotFoundError("Question version not found");
    }

    return mapVersionResponse(version);
  }

  /**
   * Remove question (soft delete)
   */
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
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(table.questions.id, questionId));

      return { id: questionId };
    });
  }

  /**
   * Restore a deleted question (admin only)
   */
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
          updatedAt: new Date(),
        })
        .where(eq(table.questions.id, questionId))
        .returning({
          id: table.questions.id,
          skill: table.questions.skill,
          level: table.questions.level,
          format: table.questions.format,
          content: table.questions.content,
          answerKey: table.questions.answerKey,
          version: table.questions.version,
          isActive: table.questions.isActive,
          createdBy: table.questions.createdBy,
          createdAt: table.questions.createdAt,
          updatedAt: table.questions.updatedAt,
          deletedAt: table.questions.deletedAt,
        });

      const q = assertExists(updatedQuestion, "Question");

      return mapQuestionResponse(q);
    });
  }
}
