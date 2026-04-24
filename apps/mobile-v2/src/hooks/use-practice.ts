import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useReducer, useRef } from "react";
import { api } from "@/lib/api";

// ── Types (mirror frontend-v3, camelCase via api.ts) ──

export interface ListeningExerciseSummary {
  id: string; slug: string; title: string;
  description: string | null; part: number;
  estimatedMinutes: number | null;
}

export interface ListeningExercise {
  id: string; slug: string; title: string;
  description: string | null; part: number;
  audioUrl: string; transcript: string | null;
  vietnameseTranscript: string | null;
  wordTimestamps: { word: string; startMs: number; endMs: number }[];
  keywords: string[];
  estimatedMinutes: number | null;
}

export interface McqQuestion {
  id: string; displayOrder: number; question: string;
  options: string[]; correctIndex?: number; explanation?: string;
}

export interface ExerciseDetail {
  exercise: ListeningExercise;
  questions: McqQuestion[];
}

export interface SubmitResult {
  score: number; total: number;
  items: { questionId: string; isCorrect: boolean; correctIndex: number; explanation: string }[];
}

export interface SupportResult {
  coinsSpent: number;
  balanceAfter: number;
  supportLevelsUsed: { level: number; usedAt: string }[];
}

export interface ReadingExercise {
  id: string; slug: string; title: string;
  description: string | null; part: number;
  passage: string; vietnameseTranslation: string | null;
  keywords: string[];
  estimatedMinutes: number | null;
}

export interface ReadingExerciseDetail {
  exercise: ReadingExercise;
  questions: McqQuestion[];
}

export interface WritingPrompt {
  id: string; slug: string; title: string;
  part: number; minWords: number; maxWords: number;
  estimatedMinutes: number | null;
}

export interface WritingPromptDetail {
  id: string; slug: string; title: string;
  description: string | null; part: number;
  prompt: string; minWords: number; maxWords: number;
  requiredPoints: string[]; sentenceStarters: string[];
  estimatedMinutes: number | null;
}

export interface WritingSubmission {
  submissionId: string; wordCount: number; gradingStatus: string;
}

export interface SpeakingTask {
  id: string; slug: string; title: string;
  part: number; taskType: string; speakingSeconds: number;
}

export interface SpeakingTaskDetail {
  id: string; slug: string; title: string;
  part: number; taskType: string; speakingSeconds: number;
  content: { topics: { name: string; questions: string[] }[] };
}

export interface McqProgress {
  score: number; total: number;
}

// ── Queries ──

export function useListeningExercises() {
  return useQuery({
    queryKey: ["practice", "listening", "exercises"],
    queryFn: () => api.get<ListeningExerciseSummary[]>("/api/v1/practice/listening/exercises"),
    retry: false,
  });
}

export function useListeningExerciseDetail(id: string) {
  return useQuery({
    queryKey: ["practice", "listening", "exercises", id],
    queryFn: () => api.get<ExerciseDetail>(`/api/v1/practice/listening/exercises/${id}`),
    enabled: !!id,
    retry: false,
  });
}

export function useMcqProgress(skill: "listening" | "reading") {
  return useQuery({
    queryKey: ["practice", skill, "progress"],
    queryFn: () => api.get<Record<string, McqProgress>>(`/api/v1/practice/${skill}/progress`),
    retry: false,
  });
}

export function useReadingExercises() {
  return useQuery({
    queryKey: ["practice", "reading", "exercises"],
    queryFn: () => api.get<ReadingExercise[]>("/api/v1/practice/reading/exercises"),
    retry: false,
  });
}

export function useReadingExerciseDetail(id: string) {
  return useQuery({
    queryKey: ["practice", "reading", "exercises", id],
    queryFn: () => api.get<ReadingExerciseDetail>(`/api/v1/practice/reading/exercises/${id}`),
    enabled: !!id,
    retry: false,
  });
}

export function useWritingPrompts() {
  return useQuery({
    queryKey: ["practice", "writing", "prompts"],
    queryFn: () => api.get<WritingPrompt[]>("/api/v1/practice/writing/prompts"),
    retry: false,
  });
}

export function useWritingPromptDetail(id: string) {
  return useQuery({
    queryKey: ["practice", "writing", "prompts", id],
    queryFn: () => api.get<WritingPromptDetail>(`/api/v1/practice/writing/prompts/${id}`),
    enabled: !!id,
    retry: false,
  });
}

export function useSpeakingTasks() {
  return useQuery({
    queryKey: ["practice", "speaking", "tasks"],
    queryFn: () => api.get<SpeakingTask[]>("/api/v1/practice/speaking/tasks"),
    retry: false,
  });
}

export function useSpeakingTaskDetail(id: string) {
  return useQuery({
    queryKey: ["practice", "speaking", "tasks", id],
    queryFn: () => api.get<SpeakingTaskDetail>(`/api/v1/practice/speaking/tasks/${id}`),
    enabled: !!id,
    retry: false,
  });
}

// ── MCQ session (listening + reading) ──

interface McqState {
  answers: Record<string, number>;
  result: SubmitResult | null;
}

type McqAction =
  | { type: "select"; questionId: string; index: number }
  | { type: "submitted"; result: SubmitResult };

function mcqReducer(state: McqState, action: McqAction): McqState {
  switch (action.type) {
    case "select":
      return { ...state, answers: { ...state.answers, [action.questionId]: action.index } };
    case "submitted":
      return { ...state, result: action.result };
  }
}

export function useMcqSession(
  sessionId: string | null,
  submitFn: (sessionId: string, answers: { question_id: string; selected_index: number }[]) => Promise<SubmitResult>,
  skill: "listening" | "reading",
) {
  const [state, dispatch] = useReducer(mcqReducer, { answers: {}, result: null });
  const answersRef = useRef(state.answers);
  answersRef.current = state.answers;
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      if (!sessionId) throw new Error("No session");
      return submitFn(
        sessionId,
        Object.entries(answersRef.current).map(([question_id, selected_index]) => ({ question_id, selected_index })),
      );
    },
    onSuccess: (result) => {
      dispatch({ type: "submitted", result });
      qc.invalidateQueries({ queryKey: ["practice", skill, "progress"] });
    },
  });

  return {
    answers: state.answers,
    result: state.result,
    submitting: mutation.isPending,
    answeredCount: Object.keys(state.answers).length,
    select: (questionId: string, index: number) => dispatch({ type: "select", questionId, index }),
    submit: () => mutation.mutate(),
  };
}

// ── API calls ──

export async function startListeningSession(exerciseId: string) {
  return api.post<{ id: string; startedAt: string }>("/api/v1/practice/listening/sessions", { exerciseId });
}

export async function submitListeningSession(
  sessionId: string,
  answers: { question_id: string; selected_index: number }[],
) {
  return api.post<SubmitResult>(`/api/v1/practice/listening/sessions/${sessionId}/submit`, { answers });
}

export async function startReadingSession(exerciseId: string) {
  return api.post<{ id: string; startedAt: string }>("/api/v1/practice/reading/sessions", { exerciseId });
}

export async function submitReadingSession(
  sessionId: string,
  answers: { question_id: string; selected_index: number }[],
) {
  return api.post<SubmitResult>(`/api/v1/practice/reading/sessions/${sessionId}/submit`, { answers });
}

export async function startWritingSession(promptId: string) {
  return api.post<{ sessionId: string; startedAt: string }>("/api/v1/practice/writing/sessions", { exerciseId: promptId });
}

export async function submitWritingSession(sessionId: string, text: string) {
  return api.post<WritingSubmission>(`/api/v1/practice/writing/sessions/${sessionId}/submit`, { text });
}

export async function startSpeakingSession(taskId: string) {
  return api.post<{ sessionId: string; startedAt: string }>("/api/v1/practice/speaking/vstep-sessions", { exerciseId: taskId });
}

export async function submitSpeakingSession(sessionId: string, audioUrl: string, durationSeconds: number) {
  return api.post<{ submissionId: string; gradingStatus: string }>(
    `/api/v1/practice/speaking/vstep-sessions/${sessionId}/submit`,
    { audioUrl, durationSeconds },
  );
}

export async function useSupport(
  skill: "listening" | "reading",
  sessionId: string,
  level: number,
) {
  return api.post<SupportResult>(
    `/api/v1/practice/${skill}/sessions/${sessionId}/support`,
    { level },
  );
}
