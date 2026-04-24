import { useMutation, useQuery } from "@tanstack/react-query";
import { useReducer } from "react";
import { api } from "@/lib/api";

// ── Types (mirror frontend-v3, camelCase via api.ts transform) ──

export interface GrammarPoint {
  id: string;
  slug: string;
  name: string;
  vietnameseName: string | null;
  summary: string | null;
  category: string | null;
  displayOrder: number;
  levels: string[];
  tasks: string[];
  functions: string[];
}

export interface GrammarStructure {
  id: string;
  template: string;
  description: string | null;
}

export interface GrammarExample {
  id: string;
  en: string;
  vi: string;
  note: string | null;
}

export interface GrammarMistake {
  id: string;
  wrong: string;
  correct: string;
  explanation: string | null;
}

export interface GrammarVstepTip {
  id: string;
  task: string;
  tip: string;
  example: string | null;
}

export type GrammarExercise =
  | { id: string; kind: "mcq"; payload: { prompt: string; options: string[] }; displayOrder: number }
  | { id: string; kind: "error_correction"; payload: { sentence: string; errorStart: number; errorEnd: number }; displayOrder: number }
  | { id: string; kind: "fill_blank"; payload: { template: string }; displayOrder: number }
  | { id: string; kind: "rewrite"; payload: { instruction: string; original: string }; displayOrder: number }

export interface GrammarMastery {
  attempts: number;
  correct: number;
  accuracyPercent: number;
  computedLevel: string;
  lastPracticedAt: string | null;
}

export interface GrammarPointDetail {
  point: GrammarPoint;
  structures: GrammarStructure[];
  examples: GrammarExample[];
  commonMistakes: GrammarMistake[];
  vstepTips: GrammarVstepTip[];
  exercises: GrammarExercise[];
  mastery: GrammarMastery | null;
}

export interface GrammarAttemptResponse {
  attemptId: string;
  isCorrect: boolean;
  explanation: string;
  mastery: GrammarMastery;
}

// ── Queries ──

export function useGrammarPoints() {
  return useQuery({
    queryKey: ["grammar", "points"],
    queryFn: () => api.get<GrammarPoint[]>("/api/v1/grammar/points"),
  });
}

export function useGrammarPointDetail(id: string) {
  return useQuery({
    queryKey: ["grammar", "points", id],
    queryFn: () => api.get<GrammarPointDetail>(`/api/v1/grammar/points/${id}`),
    enabled: !!id,
  });
}

// ── Exercise session ──

export interface GrammarResult {
  correct: boolean;
  explanation: string;
  mastery: GrammarMastery;
}

interface SessionState {
  index: number;
  selected: number | null;
  textAnswer: string;
  result: GrammarResult | null;
}

type SessionAction =
  | { type: "select"; index: number }
  | { type: "text"; value: string }
  | { type: "answered"; result: GrammarResult }
  | { type: "next" };

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "select": return { ...state, selected: action.index };
    case "text": return { ...state, textAnswer: action.value };
    case "answered": return { ...state, result: action.result };
    case "next": return { index: state.index + 1, selected: null, textAnswer: "", result: null };
  }
}

export function useGrammarExerciseSession(exercises: GrammarExercise[]) {
  const [state, dispatch] = useReducer(sessionReducer, {
    index: 0, selected: null, textAnswer: "", result: null,
  });

  const mutation = useMutation({
    mutationFn: ({ id, answer }: { id: string; answer: Record<string, unknown> }) =>
      api.post<GrammarAttemptResponse>(`/api/v1/grammar/exercises/${id}/attempt`, { answer }),
    onSuccess: (res) => {
      dispatch({
        type: "answered",
        result: { correct: res.isCorrect, explanation: res.explanation, mastery: res.mastery },
      });
    },
  });

  const current = exercises[state.index] ?? null;
  const total = exercises.length;
  const done = state.index >= total && total > 0;

  function submit() {
    if (!current || mutation.isPending) return;
    const answer = current.kind === "mcq"
      ? { selected_index: state.selected }
      : { text: state.textAnswer };
    mutation.mutate({ id: current.id, answer });
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
