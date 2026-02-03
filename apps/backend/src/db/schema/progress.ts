import {
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { questionLevelEnum } from "./questions";
import { skillEnum, submissions } from "./submissions";
import { users } from "./users";

export const streakDirectionEnum = pgEnum("streak_direction", [
  "UP",
  "DOWN",
  "NEUTRAL",
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
    scaffoldStage: integer("scaffold_stage").default(1).notNull(),
    streakCount: integer("streak_count").default(0).notNull(),
    streakDirection: streakDirectionEnum("streak_direction"),
    attemptCount: integer("attempt_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
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
    submissionId: uuid("submission_id")
      .references(() => submissions.id, { onDelete: "cascade" })
      .notNull(),
    score: integer("score").notNull(),
    scaffoldingType: varchar("scaffolding_type", { length: 20 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
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
    targetBand: integer("target_band").notNull(),
    currentEstimatedBand: varchar("current_estimated_band", { length: 10 }),
    deadline: timestamp("deadline", { withTimezone: true }),
    dailyStudyTimeMinutes: integer("daily_study_time_minutes")
      .default(30)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index("user_goals_user_idx").on(table.userId),
  }),
);

export type UserProgress = typeof userProgress.$inferSelect;
export type NewUserProgress = typeof userProgress.$inferInsert;
export type UserSkillScore = typeof userSkillScores.$inferSelect;
export type NewUserSkillScore = typeof userSkillScores.$inferInsert;
export type UserGoal = typeof userGoals.$inferSelect;
export type NewUserGoal = typeof userGoals.$inferInsert;
