import {
  foreignKey,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, timestamps } from "./columns";
import { questionLevelEnum, skillEnum, vstepBandEnum } from "./enums";
import { knowledgePoints } from "./knowledge-points";
import { submissions } from "./submissions";
import { users } from "./users";

export const streakDirectionEnum = pgEnum("streak_direction", [
  "up",
  "down",
  "neutral",
]);

export const userProgress = pgTable(
  "user_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    skill: skillEnum("skill").notNull(),
    currentLevel: questionLevelEnum("current_level").notNull(),
    targetLevel: questionLevelEnum("target_level"),
    scaffoldLevel: integer("scaffold_level").default(1).notNull(),
    streakCount: integer("streak_count").default(0).notNull(),
    streakDirection: streakDirectionEnum("streak_direction"),
    attemptCount: integer("attempt_count").default(0).notNull(),
    ...timestamps,
  },
  (table) => ({
    userSkillUnique: uniqueIndex("user_progress_user_skill_idx").on(
      table.userId,
      table.skill,
    ),
  }),
);

export const userSkillScores = pgTable(
  "user_skill_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    skill: skillEnum("skill").notNull(),
    submissionId: uuid("submission_id").references(() => submissions.id, {
      onDelete: "cascade",
    }),
    score: numeric("score", {
      precision: 3,
      scale: 1,
      mode: "number",
    }).notNull(),
    scaffoldingType: varchar("scaffolding_type", { length: 20 }),
    createdAt,
  },
  (table) => ({
    userSkillIdx: index("user_skill_scores_user_skill_idx").on(
      table.userId,
      table.skill,
      table.createdAt,
    ),
  }),
);

export const userGoals = pgTable(
  "user_goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    targetBand: vstepBandEnum("target_band").notNull(),
    currentEstimatedBand: varchar("current_estimated_band", { length: 10 }),
    deadline: timestamp("deadline", { withTimezone: true, mode: "string" }),
    dailyStudyTimeMinutes: integer("daily_study_time_minutes")
      .default(30)
      .notNull(),
    ...timestamps,
  },
  (table) => ({
    userIdx: index("user_goals_user_idx").on(table.userId),
  }),
);

export type UserProgress = typeof userProgress.$inferSelect;
export type NewUserProgress = typeof userProgress.$inferInsert;
export type UserSkillScore = typeof userSkillScores.$inferSelect;
export type NewUserSkillScore = typeof userSkillScores.$inferInsert;
export const userKnowledgeProgress = pgTable(
  "user_knowledge_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    knowledgePointId: uuid("knowledge_point_id").notNull(),
    masteryScore: numeric("mastery_score", {
      precision: 5,
      scale: 2,
      mode: "number",
    })
      .default(0)
      .notNull(),
    totalAttempted: integer("total_attempted").default(0).notNull(),
    totalCorrect: integer("total_correct").default(0).notNull(),
    ...timestamps,
  },
  (table) => ({
    userKpUnique: uniqueIndex("user_knowledge_progress_user_kp_idx").on(
      table.userId,
      table.knowledgePointId,
    ),
    kpFk: foreignKey({
      name: "user_kp_progress_kp_id_fk",
      columns: [table.knowledgePointId],
      foreignColumns: [knowledgePoints.id],
    }).onDelete("cascade"),
  }),
);

export type UserGoal = typeof userGoals.$inferSelect;
export type NewUserGoal = typeof userGoals.$inferInsert;
export type UserKnowledgeProgress = typeof userKnowledgeProgress.$inferSelect;
export type NewUserKnowledgeProgress =
  typeof userKnowledgeProgress.$inferInsert;
