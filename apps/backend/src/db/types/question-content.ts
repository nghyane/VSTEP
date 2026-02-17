import type { TSchema } from "@sinclair/typebox";
import { t } from "elysia";

// ---------------------------------------------------------------------------
// Shared item schemas
// ---------------------------------------------------------------------------

/** MCQ with 4 options (A, B, C, D) — used by listening & reading MCQ */
const MCQItem = t.Object({
  stem: t.String(),
  options: t.Array(t.String(), { minItems: 4, maxItems: 4 }),
});

/** True / Not Given item — 3 options only */
const TNGItem = t.Object({
  stem: t.String(),
  options: t.Array(t.String(), { minItems: 3, maxItems: 3 }),
});

// ---------------------------------------------------------------------------
// Listening
// ---------------------------------------------------------------------------

export const ListeningContent = t.Object({
  audioUrl: t.String({ format: "uri" }),
  transcript: t.Optional(t.String()),
  items: t.Array(MCQItem, { minItems: 1, maxItems: 15 }),
});

/** Dictation: audio + transcript with gaps, fill-in-the-blank */
export const ListeningDictationContent = t.Object({
  audioUrl: t.String({ format: "uri" }),
  transcript: t.String(),
  transcriptWithGaps: t.String(),
  items: t.Array(t.Object({ correctText: t.String() }), {
    minItems: 1,
    maxItems: 10,
  }),
});

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

/** Passages with MCQ items (standard reading comprehension) */
export const ReadingContent = t.Object({
  passage: t.String(),
  title: t.Optional(t.String()),
  items: t.Array(MCQItem, { minItems: 1, maxItems: 10 }),
});

/** True / Not Given reading items */
export const ReadingTNGContent = t.Object({
  passage: t.String(),
  title: t.Optional(t.String()),
  items: t.Array(TNGItem, { minItems: 1, maxItems: 10 }),
});

/** Gap-fill: text with numbered blanks + MCQ per blank */
export const ReadingGapFillContent = t.Object({
  title: t.Optional(t.String()),
  textWithGaps: t.String(),
  items: t.Array(
    t.Object({
      options: t.Array(t.String(), { minItems: 4, maxItems: 4 }),
    }),
    { minItems: 1, maxItems: 10 },
  ),
});

/** Matching headings: paragraphs matched to headings */
export const ReadingMatchingContent = t.Object({
  title: t.Optional(t.String()),
  paragraphs: t.Array(t.Object({ label: t.String(), text: t.String() }), {
    minItems: 1,
    maxItems: 10,
  }),
  headings: t.Array(t.String(), { minItems: 1, maxItems: 15 }),
});

// ---------------------------------------------------------------------------
// Writing
// Task 1: Letter/email (formal or informal), min 120 words
// Task 2: Academic essay (opinion/adv-disadv/problem-solution), min 250 words
// Scored on: Task Completion, Organization, Vocabulary, Grammar
// No images/charts — all text-based prompts
// ---------------------------------------------------------------------------

export const WritingContent = t.Object({
  prompt: t.String(),
  taskType: t.UnionEnum(["letter", "essay"]),
  instructions: t.Optional(t.Array(t.String())),
  minWords: t.Integer({ minimum: 50 }),
  requiredPoints: t.Optional(t.Array(t.String())),
});

// ---------------------------------------------------------------------------
// Speaking
// Part 1: Social interaction — 2 topics × 3 questions, no prep, 3 min total
// Part 2: Solution discussion — situation + 3 options, 1 min prep, 2 min speak
// Part 3: Topic development — mind-map + follow-up, 1 min prep, 4-5 min speak
// ---------------------------------------------------------------------------

export const SpeakingPart1Content = t.Object({
  topics: t.Array(
    t.Object({
      name: t.String(),
      questions: t.Array(t.String(), { minItems: 3, maxItems: 3 }),
    }),
    { minItems: 2, maxItems: 2 },
  ),
});

export const SpeakingPart2Content = t.Object({
  situation: t.String(),
  options: t.Array(t.String(), { minItems: 3, maxItems: 3 }),
  preparationSeconds: t.Integer({ default: 60 }),
  speakingSeconds: t.Integer({ default: 120 }),
});

export const SpeakingPart3Content = t.Object({
  centralIdea: t.String(),
  suggestions: t.Array(t.String(), { minItems: 3, maxItems: 3 }),
  followUpQuestion: t.String(),
  preparationSeconds: t.Integer({ default: 60 }),
  speakingSeconds: t.Integer({ default: 300 }),
});

export const SpeakingContent = t.Union([
  SpeakingPart1Content,
  SpeakingPart2Content,
  SpeakingPart3Content,
]);

// ---------------------------------------------------------------------------
// Union of all content types
// ---------------------------------------------------------------------------

export const QuestionContent = t.Union([
  ListeningContent,
  ListeningDictationContent,
  ReadingContent,
  ReadingTNGContent,
  ReadingGapFillContent,
  ReadingMatchingContent,
  WritingContent,
  SpeakingContent,
]);

// ---------------------------------------------------------------------------
// Validation maps
// ---------------------------------------------------------------------------

export const VALID_PARTS = {
  listening: [1, 2, 3],
  reading: [1, 2, 3, 4],
  writing: [1, 2],
  speaking: [1, 2, 3],
} as const;

export const OBJECTIVE_SKILLS = new Set(["listening", "reading"] as const);

const ReadingContentUnion = t.Union([
  ReadingContent,
  ReadingTNGContent,
  ReadingGapFillContent,
  ReadingMatchingContent,
]);

export const CONTENT_MAP: Record<string, TSchema> = {
  "listening:1": ListeningContent,
  "listening:2": ListeningContent,
  "listening:3": ListeningContent,
  "reading:1": ReadingContentUnion,
  "reading:2": ReadingContentUnion,
  "reading:3": ReadingContentUnion,
  "reading:4": ReadingContentUnion,
  "writing:1": WritingContent,
  "writing:2": WritingContent,
  "speaking:1": SpeakingPart1Content,
  "speaking:2": SpeakingPart2Content,
  "speaking:3": SpeakingPart3Content,
};

// ---------------------------------------------------------------------------
// Static types
// ---------------------------------------------------------------------------

export type ListeningContent = typeof ListeningContent.static;
export type ListeningDictationContent = typeof ListeningDictationContent.static;
export type ReadingContent = typeof ReadingContent.static;
export type ReadingTNGContent = typeof ReadingTNGContent.static;
export type ReadingGapFillContent = typeof ReadingGapFillContent.static;
export type ReadingMatchingContent = typeof ReadingMatchingContent.static;
export type WritingContent = typeof WritingContent.static;
export type SpeakingPart1Content = typeof SpeakingPart1Content.static;
export type SpeakingPart2Content = typeof SpeakingPart2Content.static;
export type SpeakingPart3Content = typeof SpeakingPart3Content.static;
export type SpeakingContent = typeof SpeakingContent.static;
export type QuestionContent = typeof QuestionContent.static;
