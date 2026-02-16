import type { ObjectiveAnswerKey } from "@db/types/answers";
import type { QuestionContent } from "@db/types/question-content";
import {
  boolean,
  jsonb,
  pgTable,
  smallint,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "./columns";
import { skillEnum } from "./enums";
import { users } from "./users";

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const questions = pgTable("questions", {
  id: uuid().primaryKey().defaultRandom(),
  skill: skillEnum().notNull(),
  part: smallint().notNull(),
  content: jsonb().$type<QuestionContent>().notNull(),
  answerKey: jsonb().$type<ObjectiveAnswerKey | null>(),
  explanation: text(),
  isActive: boolean().notNull().default(true),
  createdBy: uuid().references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
