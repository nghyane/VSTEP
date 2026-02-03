import { t } from "elysia";
import {
  IdParam,
  PaginationMeta,
  PaginationQuery,
  spread,
} from "@/common/schemas";

/**
 * Skill types (re-used from submissions)
 */
export const SkillType = t.Union([
  t.Literal("listening"),
  t.Literal("reading"),
  t.Literal("writing"),
  t.Literal("speaking"),
]);

/**
 * Level types (re-used from questions)
 */
export const LevelType = t.Union([
  t.Literal("A2"),
  t.Literal("B1"),
  t.Literal("B2"),
  t.Literal("C1"),
]);

/**
 * Streak direction
 */
export const StreakDirection = t.Union([
  t.Literal("UP"),
  t.Literal("DOWN"),
  t.Literal("NEUTRAL"),
]);

/**
 * Progress Model Namespace
 */
export namespace ProgressModel {
  /**
   * User progress schema
   */
  export const userProgress = t.Object({
    id: t.String({ format: "uuid" }),
    userId: t.String({ format: "uuid" }),
    skill: SkillType,
    currentLevel: LevelType,
    targetLevel: t.Optional(t.Nullable(LevelType)),
    scaffoldStage: t.Number(),
    streakCount: t.Number(),
    streakDirection: t.Optional(t.Nullable(StreakDirection)),
    attemptCount: t.Number(),
    createdAt: t.String({ format: "date-time" }),
    updatedAt: t.String({ format: "date-time" }),
  });
  export type UserProgress = typeof userProgress.static;

  /**
   * Progress ID parameter
   */
  export const progressIdParam = IdParam;
  export type ProgressIdParam = typeof progressIdParam.static;

  /**
   * Query parameters for listing progress
   */
  export const listProgressQuery = t.Object({
    ...spread(PaginationQuery),
    skill: t.Optional(SkillType),
    currentLevel: t.Optional(LevelType),
    userId: t.Optional(t.String({ format: "uuid" })),
  });
  export type ListProgressQuery = typeof listProgressQuery.static;

  /**
   * List progress response
   */
  export const listProgressResponse = t.Object({
    data: t.Array(userProgress),
    meta: PaginationMeta,
  });
  export type ListProgressResponse = typeof listProgressResponse.static;

  /**
   * Update progress body
   */
  export const updateProgressBody = t.Object({
    skill: SkillType,
    currentLevel: LevelType,
    targetLevel: t.Optional(LevelType),
    scaffoldStage: t.Optional(t.Number()),
    streakCount: t.Optional(t.Number()),
    streakDirection: t.Optional(StreakDirection),
  });
  export type UpdateProgressBody = typeof updateProgressBody.static;
}
