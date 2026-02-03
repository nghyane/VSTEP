/**
 * Progress Module Service
 * Business logic for tracking user progress
 */

import { assertExists, toISOStringRequired } from "@common/utils";
import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import { db, table } from "@/db";
import { NotFoundError } from "@/plugins/error";
import type {
  LevelType,
  ProgressModel,
  SkillType,
  StreakDirection,
} from "./model";

const mapProgressResponse = (progress: any): ProgressModel.UserProgress => ({
  id: progress.id,
  userId: progress.userId,
  skill: progress.skill as typeof SkillType.static,
  currentLevel: progress.currentLevel as typeof LevelType.static,
  targetLevel: (progress.targetLevel as typeof LevelType.static) || undefined,
  scaffoldStage: progress.scaffoldStage,
  streakCount: progress.streakCount,
  streakDirection:
    (progress.streakDirection as typeof StreakDirection.static) || undefined,
  attemptCount: progress.attemptCount,
  createdAt: toISOStringRequired(progress.createdAt),
  updatedAt: toISOStringRequired(progress.updatedAt),
});

/**
 * Progress service with static methods
 */
export abstract class ProgressService {
  /**
   * Get progress by ID
   */
  static async getById(id: string): Promise<ProgressModel.UserProgress> {
    const [progress] = await db
      .select()
      .from(table.userProgress)
      .where(eq(table.userProgress.id, id))
      .limit(1);

    if (!progress) {
      throw new NotFoundError("Progress record not found");
    }

    return mapProgressResponse(progress);
  }

  /**
   * List user progress
   */
  static async list(
    query: ProgressModel.ListProgressQuery,
    currentUserId: string,
    isAdmin: boolean,
  ): Promise<ProgressModel.ListProgressResponse> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [];

    // Non-admin users can only see their own progress
    if (!isAdmin) {
      conditions.push(eq(table.userProgress.userId, currentUserId));
    } else if (query.userId) {
      conditions.push(eq(table.userProgress.userId, query.userId));
    }

    if (query.skill) conditions.push(eq(table.userProgress.skill, query.skill));
    if (query.currentLevel)
      conditions.push(eq(table.userProgress.currentLevel, query.currentLevel));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: count() })
      .from(table.userProgress)
      .where(whereClause);

    const total = countResult?.count || 0;

    const progressRecords = await db
      .select()
      .from(table.userProgress)
      .where(whereClause)
      .orderBy(desc(table.userProgress.updatedAt))
      .limit(limit)
      .offset(offset);

    return {
      data: progressRecords.map(mapProgressResponse),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update or create progress record
   */
  static async updateProgress(
    userId: string,
    body: ProgressModel.UpdateProgressBody,
  ): Promise<ProgressModel.UserProgress> {
    return await db.transaction(async (tx) => {
      // Try to find existing record
      const [existing] = await tx
        .select()
        .from(table.userProgress)
        .where(
          and(
            eq(table.userProgress.userId, userId),
            eq(table.userProgress.skill, body.skill),
          ),
        )
        .limit(1);

      if (existing) {
        const updateValues: any = {
          currentLevel: body.currentLevel,
          attemptCount: sql`${table.userProgress.attemptCount} + 1`,
          updatedAt: new Date(),
        };

        if (body.targetLevel) updateValues.targetLevel = body.targetLevel;
        if (body.scaffoldStage !== undefined)
          updateValues.scaffoldStage = body.scaffoldStage;
        if (body.streakCount !== undefined)
          updateValues.streakCount = body.streakCount;
        if (body.streakDirection)
          updateValues.streakDirection = body.streakDirection;

        const [updated] = await tx
          .update(table.userProgress)
          .set(updateValues)
          .where(eq(table.userProgress.id, existing.id))
          .returning();

        return mapProgressResponse(assertExists(updated, "Progress record"));
      } else {
        const [inserted] = await tx
          .insert(table.userProgress)
          .values({
            userId,
            skill: body.skill,
            currentLevel: body.currentLevel,
            targetLevel: body.targetLevel,
            scaffoldStage: body.scaffoldStage || 1,
            streakCount: body.streakCount || 0,
            streakDirection: body.streakDirection || "NEUTRAL",
            attemptCount: 1,
          })
          .returning();

        return mapProgressResponse(assertExists(inserted, "Progress record"));
      }
    });
  }
}
