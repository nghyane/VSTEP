import { assertExists } from "@common/utils";
import { db, paginate, takeFirst, takeFirstOrThrow } from "@db/index";
import {
  userVocabularyProgress,
  vocabularyTopics,
  vocabularyWords,
} from "@db/schema/vocabulary";
import { and, count, eq, sql } from "drizzle-orm";
import type {
  TopicCreateBody,
  TopicListQuery,
  TopicUpdateBody,
  WordCreateBody,
  WordUpdateBody,
} from "./schema";

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------

export async function listTopics(query: TopicListQuery) {
  const wordCountSq = db
    .select({
      topicId: vocabularyWords.topicId,
      count: count().as("count"),
    })
    .from(vocabularyWords)
    .groupBy(vocabularyWords.topicId)
    .as("wc");

  const qb = db
    .select({
      id: vocabularyTopics.id,
      name: vocabularyTopics.name,
      description: vocabularyTopics.description,
      iconKey: vocabularyTopics.iconKey,
      sortOrder: vocabularyTopics.sortOrder,
      createdAt: vocabularyTopics.createdAt,
      updatedAt: vocabularyTopics.updatedAt,
      wordCount: sql<number>`coalesce(${wordCountSq.count}, 0)`.as(
        "word_count",
      ),
    })
    .from(vocabularyTopics)
    .leftJoin(wordCountSq, eq(vocabularyTopics.id, wordCountSq.topicId))
    .orderBy(vocabularyTopics.sortOrder)
    .$dynamic();

  return paginate(qb, db.$count(vocabularyTopics), query);
}

export async function findTopic(id: string) {
  const topic = assertExists(
    await db
      .select()
      .from(vocabularyTopics)
      .where(eq(vocabularyTopics.id, id))
      .limit(1)
      .then(takeFirst),
    "Vocabulary topic",
  );

  const words = await db
    .select()
    .from(vocabularyWords)
    .where(eq(vocabularyWords.topicId, id))
    .orderBy(vocabularyWords.sortOrder);

  return { ...topic, words };
}

export async function createTopic(body: TopicCreateBody) {
  return db
    .insert(vocabularyTopics)
    .values({
      name: body.name,
      description: body.description,
      ...(body.iconKey !== undefined && { iconKey: body.iconKey }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    })
    .returning()
    .then(takeFirstOrThrow);
}

export async function updateTopic(id: string, body: TopicUpdateBody) {
  assertExists(
    await db
      .select({ id: vocabularyTopics.id })
      .from(vocabularyTopics)
      .where(eq(vocabularyTopics.id, id))
      .limit(1)
      .then(takeFirst),
    "Vocabulary topic",
  );

  return db
    .update(vocabularyTopics)
    .set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.iconKey !== undefined && { iconKey: body.iconKey }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    })
    .where(eq(vocabularyTopics.id, id))
    .returning()
    .then(takeFirstOrThrow);
}

export async function deleteTopic(id: string) {
  assertExists(
    await db
      .select({ id: vocabularyTopics.id })
      .from(vocabularyTopics)
      .where(eq(vocabularyTopics.id, id))
      .limit(1)
      .then(takeFirst),
    "Vocabulary topic",
  );

  return db
    .delete(vocabularyTopics)
    .where(eq(vocabularyTopics.id, id))
    .returning({ id: vocabularyTopics.id })
    .then(takeFirstOrThrow);
}

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

export async function listWords(topicId: string) {
  return db
    .select()
    .from(vocabularyWords)
    .where(eq(vocabularyWords.topicId, topicId))
    .orderBy(vocabularyWords.sortOrder);
}

export async function createWord(topicId: string, body: WordCreateBody) {
  assertExists(
    await db
      .select({ id: vocabularyTopics.id })
      .from(vocabularyTopics)
      .where(eq(vocabularyTopics.id, topicId))
      .limit(1)
      .then(takeFirst),
    "Vocabulary topic",
  );

  return db
    .insert(vocabularyWords)
    .values({
      topicId,
      word: body.word,
      partOfSpeech: body.partOfSpeech,
      definition: body.definition,
      explanation: body.explanation,
      ...(body.phonetic !== undefined && { phonetic: body.phonetic }),
      ...(body.audioUrl !== undefined && { audioUrl: body.audioUrl }),
      ...(body.examples !== undefined && { examples: body.examples }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    })
    .returning()
    .then(takeFirstOrThrow);
}

export async function updateWord(wordId: string, body: WordUpdateBody) {
  assertExists(
    await db
      .select({ id: vocabularyWords.id })
      .from(vocabularyWords)
      .where(eq(vocabularyWords.id, wordId))
      .limit(1)
      .then(takeFirst),
    "Vocabulary word",
  );

  return db
    .update(vocabularyWords)
    .set({
      ...(body.word !== undefined && { word: body.word }),
      ...(body.phonetic !== undefined && { phonetic: body.phonetic }),
      ...(body.audioUrl !== undefined && { audioUrl: body.audioUrl }),
      ...(body.partOfSpeech !== undefined && {
        partOfSpeech: body.partOfSpeech,
      }),
      ...(body.definition !== undefined && { definition: body.definition }),
      ...(body.explanation !== undefined && { explanation: body.explanation }),
      ...(body.examples !== undefined && { examples: body.examples }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    })
    .where(eq(vocabularyWords.id, wordId))
    .returning()
    .then(takeFirstOrThrow);
}

export async function deleteWord(wordId: string) {
  assertExists(
    await db
      .select({ id: vocabularyWords.id })
      .from(vocabularyWords)
      .where(eq(vocabularyWords.id, wordId))
      .limit(1)
      .then(takeFirst),
    "Vocabulary word",
  );

  return db
    .delete(vocabularyWords)
    .where(eq(vocabularyWords.id, wordId))
    .returning({ id: vocabularyWords.id })
    .then(takeFirstOrThrow);
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export async function getProgress(topicId: string, userId: string) {
  const [totalResult, knownRows] = await Promise.all([
    db
      .select({ total: count() })
      .from(vocabularyWords)
      .where(eq(vocabularyWords.topicId, topicId))
      .then(takeFirst),
    db
      .select({ wordId: userVocabularyProgress.wordId })
      .from(userVocabularyProgress)
      .innerJoin(
        vocabularyWords,
        eq(userVocabularyProgress.wordId, vocabularyWords.id),
      )
      .where(
        and(
          eq(vocabularyWords.topicId, topicId),
          eq(userVocabularyProgress.userId, userId),
          eq(userVocabularyProgress.known, true),
        ),
      ),
  ]);

  const knownWordIds = knownRows.map((r) => r.wordId);
  return {
    knownWordIds,
    totalWords: totalResult?.total ?? 0,
    knownCount: knownWordIds.length,
  };
}

export async function toggleKnown(
  wordId: string,
  userId: string,
  known: boolean,
) {
  assertExists(
    await db
      .select({ id: vocabularyWords.id })
      .from(vocabularyWords)
      .where(eq(vocabularyWords.id, wordId))
      .limit(1)
      .then(takeFirst),
    "Vocabulary word",
  );

  return db
    .insert(userVocabularyProgress)
    .values({
      userId,
      wordId,
      known,
      lastReviewedAt: sql`now()`,
    })
    .onConflictDoUpdate({
      target: [userVocabularyProgress.userId, userVocabularyProgress.wordId],
      set: {
        known,
        lastReviewedAt: sql`now()`,
      },
    })
    .returning()
    .then(takeFirstOrThrow);
}
