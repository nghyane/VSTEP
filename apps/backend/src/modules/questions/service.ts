/**
 * Questions Module Service
 * Business logic for question management
 * @see https://elysiajs.com/pattern/mvc.html
 */

import { assertExists, toISOString, toISOStringRequired } from "@common/utils";
import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import { db, table } from "@/db";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/plugins/error";
import type {
  QuestionFormat,
  QuestionLevel,
  QuestionModel,
  QuestionSkill,
} from "./model";

const mapQuestionResponse = (q: {
  id: string;
  skill: string;
  level: string;
  format: string;
  content: any;
  answerKey: any;
  version: number;
  isActive: boolean;
  createdBy: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null | undefined;
}): typeof QuestionModel.questionWithDetails.static => ({
  id: q.id,
  skill: q.skill as typeof QuestionSkill.static,
  level: q.level as typeof QuestionLevel.static,
  format: q.format as typeof QuestionFormat.static,
  content: q.content,
  answerKey: q.answerKey ?? undefined,
  version: q.version,
  isActive: q.isActive,
  createdBy: q.createdBy ?? undefined,
  createdAt: toISOStringRequired(q.createdAt),
  updatedAt: toISOStringRequired(q.updatedAt),
  deletedAt: toISOString(q.deletedAt ?? null) ?? undefined,
});

const mapVersionResponse = (v: {
  id: string;
  questionId: string;
  version: number;
  content: any;
  answerKey: any;
  createdAt: Date;
}): typeof QuestionModel.questionVersionInfo.static => ({
  id: v.id,
  questionId: v.questionId,
  version: v.version,
  content: v.content,
  answerKey: v.answerKey ?? undefined,
  createdAt: toISOStringRequired(v.createdAt),
});

/**
 * Question service with static methods
 */
export abstract class QuestionService {
  /**
   * Get question by ID
   * @throws NotFoundError if question not found
   */
  static async getById(
    questionId: string,
  ): Promise<QuestionModel.QuestionResponse> {
    const [question] = await db
      .select()
      .from(table.questions)
      .where(
        and(
          eq(table.questions.id, questionId),
          isNull(table.questions.deletedAt),
        ),
      )
      .limit(1);

    if (!question) {
      throw new NotFoundError("Question not found");
    }

    return mapQuestionResponse(question);
  }

  /**
   * List questions with filtering and pagination
   */
  static async list(
    query: QuestionModel.ListQuestionsQuery,
    _currentUserId: string,
    isAdmin: boolean,
  ): Promise<QuestionModel.ListQuestionsResponse> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions: ReturnType<typeof and>[] = [
      isNull(table.questions.deletedAt),
    ];

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
      .select({
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
      })
      .from(table.questions)
      .where(whereClause)
      .orderBy(desc(table.questions.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: questions.map((q) => mapQuestionResponse(q)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create new question
   */
  static async create(
    userId: string,
    body: QuestionModel.CreateQuestionBody,
  ): Promise<QuestionModel.CreateQuestionResponse> {
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
    body: QuestionModel.UpdateQuestionBody,
  ): Promise<QuestionModel.UpdateQuestionResponse> {
    return await db.transaction(async (tx) => {
      // Get question
      const [question] = await tx
        .select()
        .from(table.questions)
        .where(
          and(
            eq(table.questions.id, questionId),
            isNull(table.questions.deletedAt),
          ),
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
      const updateValues: Partial<{
        skill: typeof QuestionSkill.static;
        level: typeof QuestionLevel.static;
        format: typeof QuestionFormat.static;
        content: any;
        answerKey: any;
        isActive: boolean;
        updatedAt: Date;
      }> = {
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
    body: QuestionModel.CreateVersionBody,
  ): Promise<QuestionModel.CreateVersionResponse> {
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
          and(
            eq(table.questions.id, questionId),
            isNull(table.questions.deletedAt),
          ),
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
  static async getVersions(
    questionId: string,
  ): Promise<QuestionModel.ListQuestionVersionsResponse> {
    // Verify question exists
    const [question] = await db
      .select({ id: table.questions.id })
      .from(table.questions)
      .where(
        and(
          eq(table.questions.id, questionId),
          isNull(table.questions.deletedAt),
        ),
      )
      .limit(1);

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
  static async getVersion(
    questionId: string,
    versionId: string,
  ): Promise<QuestionModel.QuestionVersionResponse> {
    const [version] = await db
      .select({
        id: table.questionVersions.id,
        questionId: table.questionVersions.questionId,
        version: table.questionVersions.version,
        content: table.questionVersions.content,
        answerKey: table.questionVersions.answerKey,
        createdAt: table.questionVersions.createdAt,
      })
      .from(table.questionVersions)
      .where(
        and(
          eq(table.questionVersions.id, versionId),
          eq(table.questionVersions.questionId, questionId),
        ),
      )
      .limit(1);

    if (!version) {
      throw new NotFoundError("Question version not found");
    }

    return mapVersionResponse(version);
  }

  /**
   * Delete question (soft delete)
   */
  static async delete(
    questionId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<QuestionModel.DeleteQuestionResponse> {
    return await db.transaction(async (tx) => {
      // Get question
      const [question] = await tx
        .select()
        .from(table.questions)
        .where(
          and(
            eq(table.questions.id, questionId),
            isNull(table.questions.deletedAt),
          ),
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
  static async restore(
    questionId: string,
    _userId: string,
    isAdmin: boolean,
  ): Promise<QuestionModel.UpdateQuestionResponse> {
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
