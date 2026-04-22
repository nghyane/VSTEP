import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ── Vocab types (mirror frontend-v3) ──

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

export interface FsrsState {
  kind: "new" | "learning" | "review" | "relearning";
  difficulty: number;
  stability: number;
  retrievability: number;
  lapses: number;
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

export interface WordWithState {
  word: VocabWord;
  state: FsrsState;
}

export type ExerciseKind = "mcq" | "fill_blank" | "word_form";

export interface VocabExercise {
  id: string;
  displayOrder: number;
  kind: ExerciseKind;
  payload: Record<string, unknown>;
}

export interface SrsQueueResponse {
  newCount: number;
  learningCount: number;
  reviewCount: number;
  nextDueAt: string | null;
  items: WordWithState[];
}

// ── Queries ──

export function useVocabTopics() {
  return useQuery({
    queryKey: ["vocab", "topics"],
    queryFn: () => api.get<VocabTopic[]>("/api/v1/vocab/topics"),
  });
}

export function useVocabSrsQueue() {
  return useQuery({
    queryKey: ["vocab", "srs", "queue"],
    queryFn: () => api.get<SrsQueueResponse>("/api/v1/vocab/srs/queue"),
  });
}

export interface TopicDetailResponse {
  topic: VocabTopic;
  words: WordWithState[];
  exercises: VocabExercise[];
}

export function useVocabTopicDetail(id: string) {
  return useQuery({
    queryKey: ["vocab", "topics", id],
    queryFn: () => api.get<TopicDetailResponse>(`/api/v1/vocab/topics/${id}`),
    enabled: !!id,
  });
}
