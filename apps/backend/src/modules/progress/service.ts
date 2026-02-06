/**
 * Progress Module Service
 * Business logic for tracking user progress
 */

import { assertExists, serializeDates } from "@common/utils";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db, paginate, paginationMeta, table } from "@/db";
import { NotFoundError } from "@/plugins/error";

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

    return serializeDates(progress);
  }

  /**
   * List user progress
   */
  static async list(
    query: {
      page?: number;
      limit?: number;
      skill?: "listening" | "reading" | "writing" | "speaking";
      currentLevel?: "A2" | "B1" | "B2" | "C1";
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
      data: progressRecords.map(serializeDates),
      meta: paginationMeta(total, page, limit),
    };
  }

  /**
   * Update or create progress record
   */
  static async updateProgress(
    userId: string,
    body: {
      skill: "listening" | "reading" | "writing" | "speaking";
      currentLevel: "A2" | "B1" | "B2" | "C1";
      targetLevel?: "A2" | "B1" | "B2" | "C1";
      scaffoldLevel?: number;
      streakCount?: number;
      streakDirection?: "up" | "down" | "neutral";
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
        const updateValues: Record<string, unknown> = {
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

        return serializeDates(assertExists(updated, "Progress record"));
      }

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

      return serializeDates(assertExists(inserted, "Progress record"));
    });
  }
}
