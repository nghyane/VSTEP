import {
  foreignKey,
  pgTable,
  primaryKey,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./columns";
import { knowledgePointCategoryEnum } from "./enums";
import { questions } from "./questions";

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const knowledgePoints = pgTable("knowledge_points", {
  id: uuid().primaryKey().defaultRandom(),
  category: knowledgePointCategoryEnum().notNull(),
  name: varchar({ length: 200 }).notNull().unique(),
  ...timestamps,
});

export const questionKnowledgePoints = pgTable(
  "question_knowledge_points",
  {
    questionId: uuid()
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    knowledgePointId: uuid().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.questionId, table.knowledgePointId] }),
    kpFk: foreignKey({
      name: "question_kp_kp_id_fk",
      columns: [table.knowledgePointId],
      foreignColumns: [knowledgePoints.id],
    }).onDelete("cascade"),
  }),
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type KnowledgePoint = typeof knowledgePoints.$inferSelect;
export type NewKnowledgePoint = typeof knowledgePoints.$inferInsert;
export type QuestionKnowledgePoint =
  typeof questionKnowledgePoints.$inferSelect;
