// Practice queries — aligned with backend-v2 API routes
import { queryOptions } from "@tanstack/react-query";
import { type ApiResponse, api } from "@/lib/api";
import type { SkillKey } from "@/lib/skills";

// ─── Vocab ───────────────────────────────────────────────────────

export interface VocabTopic {
  id: string;
  name: string;
  description: string;
  level: string;
  word_count: number;
  tasks: { task: string }[];
}

export interface VocabWord {
  id: string;
  word: string;
  phonetic: string | null;
  part_of_speech: string;
  definition: string;
  examples: string[];
}

export interface VocabSrsState {
  kind: string;
  interval_days: number;
  due_at: string | null;
}

export interface VocabExercise {
  id: string;
  kind: string;
  prompt: string;
  options: string[] | null;
  accepted_answers: string[];
  explanation: string;
}

export const vocabTopicsQuery = queryOptions({
  queryKey: ["vocab", "topics"],
  queryFn: () => api.get<ApiResponse<VocabTopic[]>>("vocab/topics"),
  staleTime: 300_000,
});

export function vocabTopicDetailQuery(id: string) {
  return queryOptions({
    queryKey: ["vocab", "topics", id],
    queryFn: () => api.get<ApiResponse<{
      topic: VocabTopic;
      words: { word: VocabWord; state: VocabSrsState }[];
      exercises: VocabExercise[];
    }>>(`vocab/topics/${id}`),
    enabled: !!id,
  });
}

export function vocabSrsQueueQuery(limit = 50) {
  return queryOptions({
    queryKey: ["vocab", "srs", "queue", limit],
    queryFn: () => api.get<ApiResponse<{
      new_count: number;
      learning_count: number;
      review_count: number;
      items: { word: VocabWord; state: VocabSrsState }[];
    }>>(`vocab/srs/queue?limit=${limit}`),
  });
}

// ─── Grammar ─────────────────────────────────────────────────────

export interface GrammarPoint {
  id: string;
  name: string;
  vietnamese_name: string;
  summary: string;
  levels: string[];
  tasks: string[];
  exercise_count: number;
}

export interface GrammarPointDetail {
  point: GrammarPoint;
  structures: string[];
  examples: { en: string; vi: string; note?: string }[];
  common_mistakes: { wrong: string; correct: string; explanation: string }[];
  vstep_tips: { task: string; tip: string; example: string }[];
  exercises: { id: string; kind: string; prompt: string; options?: string[]; accepted_answers: string[]; explanation: string }[];
}

export const grammarPointsQuery = queryOptions({
  queryKey: ["grammar", "points"],
  queryFn: () => api.get<ApiResponse<GrammarPoint[]>>("grammar/points"),
  staleTime: 300_000,
});

export function grammarPointDetailQuery(id: string) {
  return queryOptions({
    queryKey: ["grammar", "points", id],
    queryFn: () => api.get<ApiResponse<GrammarPointDetail>>(`grammar/points/${id}`),
    enabled: !!id,
  });
}

// ─── MCQ Practice (Listening / Reading) ──────────────────────────

export interface PracticeExercise {
  id: string;
  title: string;
  part: number;
  description: string;
  estimated_minutes: number;
}

export interface PracticeQuestion {
  id: string;
  stem: string;
  options: string[];
}

export interface PracticeSession {
  id: string;
  skill: SkillKey;
  exercise_id: string;
  support_level: number;
  started_at: string;
  completed_at: string | null;
}

export function practiceExercisesQuery(skill: "listening" | "reading") {
  return queryOptions({
    queryKey: ["practice", skill, "exercises"],
    queryFn: () => api.get<ApiResponse<PracticeExercise[]>>(`practice/${skill}/exercises`),
    staleTime: 300_000,
  });
}

export function practiceExerciseDetailQuery(skill: "listening" | "reading", id: string) {
  return queryOptions({
    queryKey: ["practice", skill, "exercises", id],
    queryFn: () => api.get<ApiResponse<{ exercise: PracticeExercise; questions: PracticeQuestion[] }>>(`practice/${skill}/exercises/${id}`),
    enabled: !!id,
  });
}

export async function startPracticeSession(skill: "listening" | "reading", exerciseId: string) {
  return api.post<ApiResponse<PracticeSession>>(`practice/${skill}/sessions`, { exercise_id: exerciseId });
}

export async function submitPracticeSession(skill: "listening" | "reading", sessionId: string, answers: { question_id: string; selected_index: number }[]) {
  return api.post<ApiResponse<{ score: number; total: number; items: any[]; session: PracticeSession }>>(`practice/${skill}/sessions/${sessionId}/submit`, { answers });
}

// ─── Writing ─────────────────────────────────────────────────────

export interface WritingPrompt {
  id: string;
  part: number;
  title: string;
  prompt: string;
  min_words: number;
}

export const writingPromptsQuery = queryOptions({
  queryKey: ["practice", "writing", "prompts"],
  queryFn: () => api.get<ApiResponse<WritingPrompt[]>>("practice/writing/prompts"),
  staleTime: 300_000,
});

// ─── Speaking ────────────────────────────────────────────────────

export interface SpeakingDrill {
  id: string;
  title: string;
  level: string;
  sentence_count: number;
}

export const speakingDrillsQuery = queryOptions({
  queryKey: ["practice", "speaking", "drills"],
  queryFn: () => api.get<ApiResponse<SpeakingDrill[]>>("practice/speaking/drills"),
  staleTime: 300_000,
});
