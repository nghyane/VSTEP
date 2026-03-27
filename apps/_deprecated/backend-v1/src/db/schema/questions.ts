import type { ObjectiveAnswerKey } from "@db/types/answers";
import type { QuestionContent } from "@db/types/question-content";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  smallint,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "./columns";
import { questionLevelEnum, skillEnum } from "./enums";
import { users } from "./users";

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const questions = pgTable(
  "questions",
  {
    id: uuid().primaryKey().defaultRandom(),
    skill: skillEnum().notNull(),
    level: questionLevelEnum().notNull(),
    part: smallint().notNull(),
    content: jsonb().$type<QuestionContent>().notNull(),
    answerKey: jsonb().$type<ObjectiveAnswerKey | null>(),
    explanation: text(),
    isActive: boolean().notNull().default(true),
    createdBy: uuid().references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => ({
    skillLevelActiveIdx: index("questions_skill_level_active_idx").on(
      table.skill,
      table.level,
      table.isActive,
    ),
    skillPartIdx: index("questions_skill_part_idx").on(table.skill, table.part),
    createdByIdx: index("questions_created_by_idx").on(table.createdBy),
  }),
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
