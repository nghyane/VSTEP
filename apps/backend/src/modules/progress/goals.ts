import type { Actor } from "@common/auth-types";
import { ConflictError } from "@common/errors";
import { assertAccess, assertExists } from "@common/utils";
import { db, table, takeFirstOrThrow } from "@db/index";
import { eq } from "drizzle-orm";
import type { GoalBody, GoalUpdateBody } from "./schema";

/** Fetch the user's latest (and only) goal, or null */
export async function getLatestGoal(userId: string) {
  const goal = await db.query.userGoals.findFirst({
    where: eq(table.userGoals.userId, userId),
  });
  return goal ?? null;
}

export async function createGoal(userId: string, body: GoalBody) {
  const existing = await db.query.userGoals.findFirst({
    where: eq(table.userGoals.userId, userId),
  });
  if (existing) {
    throw new ConflictError(
      "User already has an active goal. Update or delete it first.",
    );
  }

  return db
    .insert(table.userGoals)
    .values({
      userId,
      targetBand: body.targetBand,
      deadline: body.deadline,
      ...(body.dailyStudyTimeMinutes !== undefined && {
        dailyStudyTimeMinutes: body.dailyStudyTimeMinutes,
      }),
    })
    .returning()
    .then(takeFirstOrThrow);
}

export async function updateGoal(
  actor: Actor,
  goalId: string,
  body: GoalUpdateBody,
) {
  const existing = assertExists(
    await db.query.userGoals.findFirst({
      where: eq(table.userGoals.id, goalId),
    }),
    "Goal",
  );

  assertAccess(existing.userId, actor);

  return db
    .update(table.userGoals)
    .set({
      updatedAt: new Date().toISOString(),
      ...(body.targetBand !== undefined && { targetBand: body.targetBand }),
      ...(body.deadline !== undefined && { deadline: body.deadline }),
      ...(body.dailyStudyTimeMinutes !== undefined && {
        dailyStudyTimeMinutes: body.dailyStudyTimeMinutes,
      }),
    })
    .where(eq(table.userGoals.id, goalId))
    .returning()
    .then(takeFirstOrThrow);
}

export async function removeGoal(actor: Actor, goalId: string) {
  const existing = assertExists(
    await db.query.userGoals.findFirst({
      where: eq(table.userGoals.id, goalId),
    }),
    "Goal",
  );

  assertAccess(existing.userId, actor);

  await db.delete(table.userGoals).where(eq(table.userGoals.id, goalId));

  return { id: goalId, deleted: true as const };
}
