import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const questionSkillEnum = pgEnum("question_skill", [
  "listening",
  "reading",
  "writing",
  "speaking",
]);

export const questionLevelEnum = pgEnum("question_level", [
  "A2",
  "B1",
  "B2",
  "C1",
]);

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    skill: questionSkillEnum("skill").notNull(),
    level: questionLevelEnum("level").notNull(),
    format: varchar("format", { length: 50 }).notNull(),
    content: jsonb("content").notNull(),
    answerKey: jsonb("answer_key"),
    version: integer("version").default(1).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    skillLevelIdx: index("questions_skill_level_idx").on(
      table.skill,
      table.level,
    ),
    activeIdx: index("questions_active_idx")
      .on(table.skill, table.level)
      .where(sql`${table.isActive} = true AND ${table.deletedAt} IS NULL`),
    formatIdx: index("questions_format_idx").on(table.format),
  }),
);

export const questionVersions = pgTable(
  "question_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .references(() => questions.id, { onDelete: "cascade" })
      .notNull(),
    version: integer("version").notNull(),
    content: jsonb("content").notNull(),
    answerKey: jsonb("answer_key"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    versionUnique: index("question_versions_unique_idx").on(
      table.questionId,
      table.version,
    ),
  }),
);

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type QuestionVersion = typeof questionVersions.$inferSelect;
export type NewQuestionVersion = typeof questionVersions.$inferInsert;
