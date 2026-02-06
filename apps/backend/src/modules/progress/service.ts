import { and, eq } from "drizzle-orm";
import { db, table } from "@/db";

export abstract class ProgressService {
  /** Get progress overview for all 4 skills */
  static async getOverview(userId: string) {
    const progressRecords = await db.query.userProgress.findMany({
      where: eq(table.userProgress.userId, userId),
    });
    return progressRecords;
  }

  /** Get detailed progress for a specific skill */
  static async getBySkill(skill: string, userId: string) {
    const progress = await db.query.userProgress.findFirst({
      where: and(
        eq(table.userProgress.userId, userId),
        eq(table.userProgress.skill, skill as any),
      ),
    });

    if (!progress) {
      return { skill, message: "No progress data yet" };
    }

    return progress;
  }
}
