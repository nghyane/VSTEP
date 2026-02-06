/**
 * Progress Module Service
 * Business logic for tracking user progress
 */

import { assertExists } from "@common/utils";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db, paginate, paginationMeta, table } from "@/db";
import { NotFoundError } from "@/plugins/error";

type SkillType = "listening" | "reading" | "writing" | "speaking";
type LevelType = "A2" | "B1" | "B2" | "C1";
type StreakDirectionType = "up" | "down" | "neutral";

/**
 * Mapper function for consistent progress response serialization
 */
const mapProgressResponse = (progress: {
  id: string;
  userId: string;
  skill: string;
  currentLevel: string;
  targetLevel: string | null;
  scaffoldLevel: number;
  streakCount: number;
  streakDirection: string | null;
  attemptCount: number;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: progress.id,
  userId: progress.userId,
  skill: progress.skill as SkillType,
  currentLevel: progress.currentLevel as LevelType,
  targetLevel: (progress.targetLevel as LevelType) ?? null,
  scaffoldLevel: progress.scaffoldLevel,
  streakCount: progress.streakCount,
  streakDirection: (progress.streakDirection as StreakDirectionType) ?? null,
  attemptCount: progress.attemptCount,
  createdAt: progress.createdAt.toISOString(),
  updatedAt: progress.updatedAt.toISOString(),
});

/**
 * Progress service with static methods
 */
export abstract class ProgressService {
  /**
   * Get progress by ID
   */
  static async getById(id: string) {
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
    query: {
      page?: number;
      limit?: number;
      skill?: SkillType;
      currentLevel?: LevelType;
      userId?: string;
    },
    currentUserId: string,
    isAdmin: boolean,
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;

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

    const { limit: take, offset } = paginate(page, limit);

    const progressRecords = await db
      .select()
      .from(table.userProgress)
      .where(whereClause)
      .orderBy(desc(table.userProgress.updatedAt))
      .limit(take)
      .offset(offset);

    return {
      data: progressRecords.map(mapProgressResponse),
      meta: paginationMeta(total, page, limit),
    };
  }

  /**
   * Update or create progress record
   */
  static async updateProgress(
    userId: string,
    body: {
      skill: SkillType;
      currentLevel: LevelType;
      targetLevel?: LevelType;
      scaffoldLevel?: number;
      streakCount?: number;
      streakDirection?: StreakDirectionType;
    },
  ) {
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
        if (body.scaffoldLevel !== undefined)
          updateValues.scaffoldLevel = body.scaffoldLevel;
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
            scaffoldLevel: body.scaffoldLevel || 1,
            streakCount: body.streakCount || 0,
            streakDirection: body.streakDirection || "neutral",
            attemptCount: 1,
          })
          .returning();

        return mapProgressResponse(assertExists(inserted, "Progress record"));
      }
    });
  }
}
