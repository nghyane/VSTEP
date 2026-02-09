import type { ObjectiveAnswerKey } from "@common/answer-schemas";
import type { QuestionContent } from "@common/question-content";
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, timestampsWithSoftDelete } from "./columns";
import { skillEnum } from "./enums";
import { users } from "./users";

/**
 * VSTEP formats: writing_task_1/2, speaking_part_1/2/3, reading_mcq, listening_mcq.
 * Non-VSTEP (IELTS) formats kept for extensibility: reading_tng, reading_matching_headings,
 * reading_gap_fill, listening_dictation. These are NOT used in VSTEP.3-5 exams.
 */
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
    content: jsonb("content").$type<QuestionContent>().notNull(),
    answerKey: jsonb("answer_key").$type<ObjectiveAnswerKey | null>(),
    version: integer("version").default(1).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestampsWithSoftDelete,
  },
  (table) => ({
    activeIdx: index("questions_active_idx")
      .on(table.skill, table.level)
      .where(sql`${table.isActive} = true AND ${table.deletedAt} IS NULL`),
    formatIdx: index("questions_format_idx").on(table.format),
    createdByIdx: index("questions_created_by_idx").on(table.createdBy),
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
    content: jsonb("content").$type<QuestionContent>().notNull(),
    answerKey: jsonb("answer_key").$type<ObjectiveAnswerKey | null>(),
    createdAt,
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
