// ============================================================
// Question content types — shared between practice and exam screens
// ============================================================

export interface QuestionItem {
  stem: string;
  options: string[];
}

// ─── Listening ──────────────────────────────────────────────

export interface ListeningContent {
  audioUrl: string;
  transcript?: string;
  items: QuestionItem[];
}

// ─── Reading (4 sub-types) ──────────────────────────────────

export interface ReadingContent {
  passage: string;
  title?: string;
  items: QuestionItem[];
}

export interface ReadingTNGContent {
  passage: string;
  title?: string;
  items: { stem: string; options: string[] }[];
}

export interface ReadingGapFillContent {
  title?: string;
  textWithGaps: string;
  items: { options: string[] }[];
}

export interface ReadingMatchingContent {
  title?: string;
  paragraphs: { label: string; text: string }[];
  headings: string[];
}

// ─── Writing ────────────────────────────────────────────────

export interface WritingContent {
  prompt: string;
  taskType: string;
  instructions?: string;
  minWords?: number;
  requiredPoints?: string[];
}

// ─── Speaking (3 parts) ─────────────────────────────────────

export interface SpeakingPart1Content {
  topics: { name: string; questions: string[] }[];
}

export interface SpeakingPart2Content {
  situation: string;
  options: string[];
  preparationSeconds: number;
  speakingSeconds: number;
}

export interface SpeakingPart3Content {
  centralIdea: string;
  suggestions: string[];
  followUpQuestion: string;
  preparationSeconds: number;
  speakingSeconds: number;
}

// ─── Union & discriminators ─────────────────────────────────

export type QuestionContent =
  | ListeningContent
  | ReadingContent
  | ReadingTNGContent
  | ReadingGapFillContent
  | ReadingMatchingContent
  | WritingContent
  | SpeakingPart1Content
  | SpeakingPart2Content
  | SpeakingPart3Content;

export type ContentKind = "objective" | "writing" | "speaking";

export function detectContentKind(content: QuestionContent, skill?: string): ContentKind {
  if (skill === "writing") return "writing";
  if (skill === "speaking") return "speaking";
  if (skill === "listening" || skill === "reading") return "objective";
  if ("items" in content || "textWithGaps" in content || "paragraphs" in content) return "objective";
  if ("prompt" in content) return "writing";
  return "speaking";
}

// ─── Reading type guards ────────────────────────────────────

export function isReadingPassageContent(c: unknown): c is ReadingContent {
  return c !== null && typeof c === "object" && "passage" in c && "items" in c;
}

export function isReadingGapFillContent(c: unknown): c is ReadingGapFillContent {
  return c !== null && typeof c === "object" && "textWithGaps" in c;
}

export function isReadingMatchingContent(c: unknown): c is ReadingMatchingContent {
  return c !== null && typeof c === "object" && "paragraphs" in c && "headings" in c;
}

// ─── Answer types ───────────────────────────────────────────

export interface ObjectiveAnswer {
  answers: Record<string, string>;
}

export interface WritingAnswer {
  text: string;
}

export interface SpeakingAnswer {
  audioUrl: string;
  durationSeconds: number;
  transcript?: string;
}

export type SubmissionAnswer = ObjectiveAnswer | WritingAnswer | SpeakingAnswer;
