import { t } from "elysia";

// ---------------------------------------------------------------------------
// Response schemas
// ---------------------------------------------------------------------------

export const VocabularyTopicRow = t.Object({
  id: t.String({ format: "uuid" }),
  name: t.String(),
  description: t.String(),
  iconKey: t.Nullable(t.String()),
  sortOrder: t.Integer(),
  createdAt: t.String(),
  updatedAt: t.String(),
});
export type VocabularyTopicRow = typeof VocabularyTopicRow.static;

export const VocabularyWord = t.Object({
  id: t.String({ format: "uuid" }),
  word: t.String(),
  phonetic: t.Nullable(t.String()),
  audioUrl: t.Nullable(t.String()),
  partOfSpeech: t.String(),
  definition: t.String(),
  explanation: t.String(),
  examples: t.Array(t.String()),
  sortOrder: t.Integer(),
  createdAt: t.String(),
  updatedAt: t.String(),
});
export type VocabularyWord = typeof VocabularyWord.static;

export const VocabularyTopic = t.Object({
  id: t.String({ format: "uuid" }),
  name: t.String(),
  description: t.String(),
  iconKey: t.Nullable(t.String()),
  wordCount: t.Integer(),
  sortOrder: t.Integer(),
  createdAt: t.String(),
  updatedAt: t.String(),
});
export type VocabularyTopic = typeof VocabularyTopic.static;

export const VocabularyTopicDetail = t.Object({
  id: t.String({ format: "uuid" }),
  name: t.String(),
  description: t.String(),
  iconKey: t.Nullable(t.String()),
  sortOrder: t.Integer(),
  createdAt: t.String(),
  updatedAt: t.String(),
  words: t.Array(VocabularyWord),
});
export type VocabularyTopicDetail = typeof VocabularyTopicDetail.static;

export const TopicProgress = t.Object({
  knownWordIds: t.Array(t.String({ format: "uuid" })),
  totalWords: t.Integer(),
  knownCount: t.Integer(),
});
export type TopicProgress = typeof TopicProgress.static;

// ---------------------------------------------------------------------------
// Request schemas
// ---------------------------------------------------------------------------

export const TopicCreateBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  description: t.String({ minLength: 1 }),
  iconKey: t.Optional(t.String()),
  sortOrder: t.Optional(t.Integer()),
});
export type TopicCreateBody = typeof TopicCreateBody.static;

export const TopicUpdateBody = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
  description: t.Optional(t.String({ minLength: 1 })),
  iconKey: t.Optional(t.String()),
  sortOrder: t.Optional(t.Integer()),
});
export type TopicUpdateBody = typeof TopicUpdateBody.static;

export const WordCreateBody = t.Object({
  word: t.String({ minLength: 1, maxLength: 100 }),
  phonetic: t.Optional(t.String()),
  audioUrl: t.Optional(t.String()),
  partOfSpeech: t.String({ minLength: 1, maxLength: 20 }),
  definition: t.String({ minLength: 1 }),
  explanation: t.String({ minLength: 1 }),
  examples: t.Optional(t.Array(t.String())),
  sortOrder: t.Optional(t.Integer()),
});
export type WordCreateBody = typeof WordCreateBody.static;

export const WordUpdateBody = t.Object({
  word: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  phonetic: t.Optional(t.String()),
  audioUrl: t.Optional(t.String()),
  partOfSpeech: t.Optional(t.String({ minLength: 1, maxLength: 20 })),
  definition: t.Optional(t.String({ minLength: 1 })),
  explanation: t.Optional(t.String({ minLength: 1 })),
  examples: t.Optional(t.Array(t.String())),
  sortOrder: t.Optional(t.Integer()),
});
export type WordUpdateBody = typeof WordUpdateBody.static;

export const KnownBody = t.Object({
  known: t.Boolean(),
});
export type KnownBody = typeof KnownBody.static;

export const TopicListQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 50 })),
});
export type TopicListQuery = typeof TopicListQuery.static;
