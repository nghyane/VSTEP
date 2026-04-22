// Synced with backend-v2 VocabController + FSRS migration

export interface VocabTopic {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  level: string;
  iconKey: string | null;
  displayOrder: number;
  tasks: string[];
  wordCount?: number;
}

export interface VocabWord {
  id: string;
  word: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  definition: string;
  example: string | null;
  synonyms: string[];
  collocations: string[];
  wordFamily: string[];
  vstepTip: string | null;
}

export interface FsrsState {
  kind: "new" | "learning" | "review" | "relearning";
  difficulty: number;
  stability: number;
  retrievability: number;
  lapses: number;
}

export type SrsRating = 1 | 2 | 3 | 4;

export interface WordWithState {
  word: VocabWord;
  state: FsrsState;
}

export interface TopicDetailResponse {
  topic: VocabTopic;
  words: WordWithState[];
  exercises: VocabExercise[];
}

export interface SrsQueueResponse {
  newCount: number;
  learningCount: number;
  reviewCount: number;
  nextDueAt: string | null;
  items: WordWithState[];
}

export interface ReviewResponse {
  state: FsrsState;
  reviewId: string;
}

export interface AttemptResponse {
  attemptId: string;
  isCorrect: boolean;
  explanation: string | null;
}

export type ExerciseKind = "mcq" | "fill_blank" | "word_form";

interface BaseExercise {
  id: string;
  displayOrder: number;
}

export type VocabExercise =
  | (BaseExercise & { kind: "mcq"; payload: { prompt: string; options: string[] } })
  | (BaseExercise & { kind: "fill_blank"; payload: { sentence: string } })
  | (BaseExercise & { kind: "word_form"; payload: { instruction: string; sentence: string; rootWord: string } });
