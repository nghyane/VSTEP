import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useReducer } from "react";
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
  learnedCount?: number;
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

// ── SRS review mutation with invalidation ──

export interface SrsReviewPayload {
  wordId: string;
  rating: number;
}

export function useSrsReviewMutation(topicId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SrsReviewPayload) =>
      api.post("/api/v1/vocab/srs/review", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vocab", "srs"] });
      if (topicId) {
        qc.invalidateQueries({ queryKey: ["vocab", "topics", topicId] });
      }
    },
  });
}

// ── Exercise submission mutation ──

export interface VocabAttemptResponse {
  isCorrect: boolean;
  explanation: string | null;
}

export function useVocabAttemptMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, answer }: { id: string; answer: Record<string, unknown> }) =>
      api.post<VocabAttemptResponse>(`/api/v1/vocab/exercises/${id}/attempt`, { answer }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vocab", "srs"] });
      qc.invalidateQueries({ queryKey: ["vocab", "topics"] });
    },
  });
}

// ── Vocab exercise session hook (reusable) ──

export interface VocabExerciseResult {
  isCorrect: boolean;
  explanation: string | null;
}

interface VocabSessionState {
  index: number;
  selected: number | null;
  textAnswer: string;
  result: VocabExerciseResult | null;
}

type VocabSessionAction =
  | { type: "select"; index: number }
  | { type: "text"; value: string }
  | { type: "answered"; result: VocabExerciseResult }
  | { type: "next" };

function vocabSessionReducer(state: VocabSessionState, action: VocabSessionAction): VocabSessionState {
  switch (action.type) {
    case "select": return { ...state, selected: action.index };
    case "text": return { ...state, textAnswer: action.value };
    case "answered": return { ...state, result: action.result };
    case "next": return { index: state.index + 1, selected: null, textAnswer: "", result: null };
  }
}

export function useVocabExerciseSession(exercises: VocabExercise[]) {
  const [state, dispatch] = useReducer(vocabSessionReducer, {
    index: 0, selected: null, textAnswer: "", result: null,
  });

  const mutation = useVocabAttemptMutation();

  const current = exercises[state.index] ?? null;
  const total = exercises.length;
  const done = state.index >= total && total > 0;

  function submit() {
    if (!current || mutation.isPending) return;
    let answer: Record<string, unknown>;
    if (current.kind === "mcq") {
      answer = { selected_index: state.selected };
    } else {
      answer = { text: state.textAnswer };
    }
    mutation.mutate({ id: current.id, answer }, {
      onSuccess: (res) => {
        dispatch({ type: "answered", result: { isCorrect: res.isCorrect, explanation: res.explanation } });
      },
      onError: () => {
        dispatch({ type: "answered", result: { isCorrect: false, explanation: "Không thể kiểm tra. Vui lòng thử lại." } });
      },
    });
  }

  return {
    current,
    total,
    index: state.index,
    done,
    selected: state.selected,
    textAnswer: state.textAnswer,
    result: state.result,
    submitting: mutation.isPending,
    select: (i: number) => dispatch({ type: "select", index: i }),
    setTextAnswer: (v: string) => dispatch({ type: "text", value: v }),
    submit,
    next: () => dispatch({ type: "next" }),
  };
}
