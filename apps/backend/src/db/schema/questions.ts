import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { skillEnum } from "./submissions";
import { users } from "./users";

export const questionFormatEnum = pgEnum("question_format", [
  "writing_task_1",
  "writing_task_2",
  "speaking_part_1",
  "speaking_part_2",
  "speaking_part_3",
  "reading_mcq",
  "reading_tng",
  "reading_matching_headings",
  "reading_gap_fill",
  "listening_mcq",
  "listening_dictation",
]);

export const questionLevelEnum = pgEnum("question_level", [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
]);

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    skill: skillEnum("skill").notNull(),
    level: questionLevelEnum("level").notNull(),
    format: questionFormatEnum("format").notNull(),
    content: jsonb("content").notNull(),
    answerKey: jsonb("answer_key"),
    version: integer("version").default(1).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
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
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    versionUnique: uniqueIndex("question_versions_unique_idx").on(
      table.questionId,
      table.version,
    ),
  }),
);

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type QuestionVersion = typeof questionVersions.$inferSelect;
export type NewQuestionVersion = typeof questionVersions.$inferInsert;
