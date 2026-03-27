import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./columns";
import { users } from "./users";

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const vocabularyTopics = pgTable("vocabulary_topics", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 200 }).notNull().unique(),
  description: text().notNull(),
  iconKey: varchar("icon_key", { length: 100 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  ...timestamps,
});

export const vocabularyWords = pgTable(
  "vocabulary_words",
  {
    id: uuid().primaryKey().defaultRandom(),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => vocabularyTopics.id, { onDelete: "cascade" }),
    word: varchar({ length: 100 }).notNull(),
    phonetic: varchar({ length: 100 }),
    audioUrl: varchar("audio_url", { length: 500 }),
    partOfSpeech: varchar("part_of_speech", { length: 20 }).notNull(),
    definition: text().notNull(),
    explanation: text().notNull(),
    examples: jsonb().$type<string[]>().notNull().default([]),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => ({
    topicIdx: index("vocabulary_words_topic_idx").on(table.topicId),
  }),
);

export const userVocabularyProgress = pgTable(
  "user_vocabulary_progress",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    wordId: uuid("word_id")
      .notNull()
      .references(() => vocabularyWords.id, { onDelete: "cascade" }),
    known: boolean().default(false).notNull(),
    lastReviewedAt: timestamp("last_reviewed_at", {
      withTimezone: true,
      mode: "string",
    }),
    ...timestamps,
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.wordId] }),
  }),
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VocabularyTopic = typeof vocabularyTopics.$inferSelect;
export type NewVocabularyTopic = typeof vocabularyTopics.$inferInsert;
export type VocabularyWord = typeof vocabularyWords.$inferSelect;
export type NewVocabularyWord = typeof vocabularyWords.$inferInsert;
export type UserVocabularyProgress = typeof userVocabularyProgress.$inferSelect;
export type NewUserVocabularyProgress =
  typeof userVocabularyProgress.$inferInsert;
