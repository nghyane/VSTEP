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

export interface WritingSubmission {
  submissionId: string; wordCount: number; submittedAt: string; gradingStatus: string;
}

export interface WritingOutlineSection {
  id: string; displayOrder: number; title: string; content: string;
}

export interface WritingTemplateSection {
  id: string; displayOrder: number; heading: string; body: string;
}

export interface WritingPromptDetail {
  id: string; slug: string; title: string;
  description: string | null; part: number;
  prompt: string; minWords: number; maxWords: number;
  requiredPoints: string[]; sentenceStarters: string[];
  keywords: string[]; sampleAnswer: string | null;
  sampleMarkers: { criterion: string; band: number; description: string }[];
  outlineSections: WritingOutlineSection[];
  templateSections: WritingTemplateSection[];
  estimatedMinutes: number | null;
}

export interface WritingHistoryItem {
  id: string;
  submittedAt: string;
  wordCount: number;
  prompt: { id: string; slug: string; title: string; part: number } | null;
}

export interface GradingJobStatus {
  id: string;
  status: "pending" | "processing" | "ready" | "failed";
  attempts: number;
  result: WritingGradingResult | null;
  completedAt: string | null;
  lastError: string | null;
}

export interface WritingGradingResult {
  rubricScores: { taskAchievement: number; coherence: number; lexical: number; grammar: number } | null;
  overallBand: number | null;
  strengths: string[];
  improvements: { message: string; explanation: string }[];
  rewrites: { original: string; improved: string; reason: string }[];
  annotations: unknown[];
  paragraphFeedback: Record<string, string>[];
}

export interface SpeakingTopic {
  name: string;
  questions: string[];
}

export interface SpeakingTask {
  id: string; slug: string; title: string;
  part: number; taskType: string; speakingSeconds: number;
}

export interface SpeakingTaskDetail {
  id: string; slug: string; title: string;
  part: number; taskType: string; speakingSeconds: number;
  content: { topics: SpeakingTopic[] };
}

export interface SpeakingDrill {
  id: string; slug: string; title: string;
  level: string; estimatedMinutes: number | null;
  description: string | null;
}

export interface SpeakingDrillSentence {
  id: string; text: string; translation: string | null;
}

export interface SpeakingDrillDetail {
  id: string; slug: string; title: string;
  level: string; estimatedMinutes: number | null;
  description: string | null;
  sentences: SpeakingDrillSentence[];
}

export interface SpeakingVstepHistoryItem {
  id: string; submittedAt: string;
  durationSeconds: number; taskRefId: string;
}

export interface SpeakingDrillHistoryItem {
  id: string; contentRefId: string;
  startedAt: string; endedAt: string | null;
  durationSeconds: number; attemptCount: number;
}

export interface SpeakingDrillAttemptResponse {
  attemptId: string; accuracyPercent: number;
}

export interface SpeakingConversationScenario {
  id: string;
  slug: string;
  title: string;
  level: string;
  characterName: string;
  characterVoice: string | null;
  description: string | null;
  estimatedMinutes: number | null;
  targetVocab?: string[];
  expectedTurns?: number;
}

export interface SpeakingConversationTurn {
  id: string;
  role: "user" | "assistant" | "ai";
  text: string;
  ipa: string | null;
  feedback: SpeakingConversationTurnFeedback | null;
  suggestedWords: string[];
}

export interface SpeakingConversationTurnFeedback {
  wordCount?: { used: number; target: number };
  grammarOk?: boolean;
  grammarCorrections?: { wrong?: string; correct?: string; explanation?: string }[];
  vocabCheck?: { phrase: string; used: boolean }[];
  better?: string | null;
  betterIpa?: string | null;
  userIpa?: string | null;
}

export interface SpeakingConversationSession {
  sessionId: string;
  scenario: SpeakingConversationScenario & {
    targetVocab: string[];
    expectedTurns: number;
  };
  turns: SpeakingConversationTurn[];
}

export interface SpeakingConversationTurnResponse {
  userTurn: SpeakingConversationTurn;
  aiTurn: SpeakingConversationTurn;
  session: {
    userTurnCount: number;
    expectedTurns: number;
    shouldEnd: boolean;
  };
}

export interface SpeakingConversationEndSummary {
  sessionId: string;
  durationSeconds: number;
  userTurnCount: number;
  vocabUsedCount: number;
  vocabTargetCount: number;
  grammarOkCount: number;
  vocabUsedPct: number;
  grammarOkPct: number;
}

export interface SpeakingConversationReview {
  strengths: string[];
  improvements: string[];
  correctedSentences: { original: string; corrected: string; explanation: string }[];
  tip: string | null;
}

export interface SpeakingPronunciationReview {
  pronunciation?: string;
  intonation?: string;
  tip?: string;
}

export interface SpeakingGradingResult {
  rubricScores: { fluency: number; pronunciation: number; content: number; vocab: number; grammar: number } | null;
  overallBand: number | null;
  strengths: string[];
  improvements: { message: string; explanation: string }[];
  pronunciationReport: { accuracyScore: number } | null;
  transcript: string | null;
}

export interface PresignUploadResponse {
  uploadUrl: string;
  audioKey: string;
}

export async function presignUpload(context: "speaking" | "exam_speaking" = "speaking") {
  return api.post<PresignUploadResponse>("/api/v1/audio/presign-upload", { context });
}

export async function presignDownload(audioKey: string) {
  return api.post<{ downloadUrl: string }>("/api/v1/audio/presign-download", { audioKey });
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

// ── Speaking Drill ──

export function useSpeakingDrills(level?: string) {
  const params = level ? `?level=${level}` : "";
  return useQuery({
    queryKey: ["practice", "speaking", "drills", level],
    queryFn: () => api.get<SpeakingDrill[]>(`/api/v1/practice/speaking/drills${params}`),
    retry: false,
  });
}

export function useSpeakingDrillDetail(id: string) {
  return useQuery({
    queryKey: ["practice", "speaking", "drills", id],
    queryFn: () => api.get<SpeakingDrillDetail>(`/api/v1/practice/speaking/drills/${id}`),
    enabled: !!id,
    retry: false,
  });
}

export function useSpeakingConversationScenarios(level?: string) {
  const params = level ? `?level=${level}` : "";
  return useQuery({
    queryKey: ["practice", "speaking", "conversation-scenarios", level],
    queryFn: () => api.get<SpeakingConversationScenario[]>(`/api/v1/practice/speaking/scenarios${params}`),
    retry: false,
  });
}

export function useSpeakingConversationScenario(id: string) {
  return useQuery({
    queryKey: ["practice", "speaking", "conversation-scenarios", id],
    queryFn: () => api.get<SpeakingConversationScenario>(`/api/v1/practice/speaking/scenarios/${id}`),
    enabled: !!id,
    retry: false,
  });
}

export function useSpeakingConversationSession(sessionId: string) {
  return useQuery({
    queryKey: ["practice", "speaking", "conversation-session", sessionId],
    queryFn: () => api.get<SpeakingConversationSession>(`/api/v1/practice/speaking/conversations/${sessionId}`),
    enabled: !!sessionId,
    retry: false,
  });
}

export function useSpeakingConversationReview(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: ["practice", "speaking", "conversation-review", sessionId],
    queryFn: () => api.get<SpeakingConversationReview>(`/api/v1/practice/speaking/conversations/${sessionId}/review`),
    enabled: enabled && !!sessionId,
    retry: false,
  });
}

export interface SpeakingConversationHistoryItem {
  id: string;
  scenario: { id: string; title: string; level: string };
  endedAt: string;
  durationSeconds: number;
  userTurnCount: number;
  vocabUsedPct: number;
}

export function useSpeakingConversationHistory() {
  return useQuery({
    queryKey: ["practice", "speaking", "conversation-history"],
    queryFn: () =>
      api.get<SpeakingHistoryResponse<SpeakingConversationHistoryItem>>(
        "/api/v1/practice/speaking/conversations/history",
      ),
    retry: false,
    select: (res) => res.data,
  });
}

export interface SpeakingHistoryResponse<T> {
  data: T[];
  links?: { first: string; last: string; prev: string | null; next: string | null };
  meta?: { currentPage: number; lastPage: number; perPage: number; total: number };
}

export function useSpeakingDrillHistory() {
  return useQuery({
    queryKey: ["practice", "speaking", "drill-history"],
    queryFn: () => api.get<SpeakingHistoryResponse<SpeakingDrillHistoryItem>>("/api/v1/practice/speaking/drill-history"),
    retry: false,
    select: (res) => res.data,
  });
}

export function useSpeakingVstepHistory(part?: number) {
  const params = part ? `?part=${part}` : "";
  return useQuery({
    queryKey: ["practice", "speaking", "vstep-history", part],
    queryFn: () => api.get<SpeakingHistoryResponse<SpeakingVstepHistoryItem>>(`/api/v1/practice/speaking/vstep-history${params}`),
    retry: false,
    select: (res) => res.data,
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

export async function startSpeakingDrillSession(drillId: string) {
  return api.post<{ sessionId: string; startedAt: string }>("/api/v1/practice/speaking/drill-sessions", { exerciseId: drillId });
}

export async function submitSpeakingDrillAttempt(
  sessionId: string,
  sentenceId: string,
  mode: "dictation" | "shadowing",
  userText: string | null,
  accuracyPercent: number | null,
) {
  return api.post<SpeakingDrillAttemptResponse>(
    `/api/v1/practice/speaking/drill-sessions/${sessionId}/attempt`,
    { sentenceId, mode, userText, accuracyPercent },
  );
}

export async function startSpeakingConversation(scenarioId: string) {
  return api.post<SpeakingConversationSession>("/api/v1/practice/speaking/conversations", { scenarioId });
}

export async function submitSpeakingConversationTurn(sessionId: string, text: string, confidence = 1) {
  return api.post<SpeakingConversationTurnResponse>(
    `/api/v1/practice/speaking/conversations/${sessionId}/turn`,
    { text, confidence },
  );
}

export async function endSpeakingConversation(sessionId: string) {
  return api.post<SpeakingConversationEndSummary>(
    `/api/v1/practice/speaking/conversations/${sessionId}/end`,
    {},
  );
}

export async function requestSpeakingPronunciationReview(original: string, transcript: string) {
  return api.post<SpeakingPronunciationReview>(
    "/api/v1/practice/speaking/pronunciation-review",
    { original, transcript },
  );
}

export async function submitSpeakingSession(sessionId: string, audioUrl: string, durationSeconds: number) {
  return api.post<{ submissionId: string; gradingStatus: string }>(
    `/api/v1/practice/speaking/vstep-sessions/${sessionId}/submit`,
    { audioUrl, durationSeconds },
  );
}

export async function requestSupport(
  skill: "listening" | "reading",
  sessionId: string,
  level: number,
) {
  return api.post<SupportResult>(
    `/api/v1/practice/${skill}/sessions/${sessionId}/support`,
    { level },
  );
}

export async function requestWritingSupport(sessionId: string, level: number) {
  return api.post<SupportResult>(
    `/api/v1/practice/writing/sessions/${sessionId}/support`,
    { level },
  );
}

// ── Writing history ──

export interface WritingHistoryResponse {
  data: WritingHistoryItem[];
  links: { first: string; last: string; prev: string | null; next: string | null };
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

export function useWritingHistory(part?: number) {
  const params = part ? `?part=${part}` : "";
  return useQuery({
    queryKey: ["practice", "writing", "history", part],
    queryFn: () => api.get<WritingHistoryResponse>(`/api/v1/practice/writing/history${params}`),
    retry: false,
    select: (res) => res.data,
  });
}

// ── Grading job status polling ──

export function useGradingJobStatus(jobId: string) {
  return useQuery({
    queryKey: ["grading", "job", jobId],
    queryFn: () => api.get<GradingJobStatus>(`/api/v1/grading/jobs/${jobId}/status`),
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status === "ready" || status === "failed" ? false : 3000;
    },
    retry: false,
  });
}

// ── Writing grading result ──

export function useWritingGradingResult(submissionId: string) {
  return useQuery({
    queryKey: ["grading", "writing", "result", submissionId],
    queryFn: () =>
      api.get<WritingGradingResult | null>(
        `/api/v1/grading/writing/practice_writing/${submissionId}`,
      ),
    refetchInterval: (q) => (q.state.data?.overallBand != null ? false : 5000),
    retry: false,
  });
}

export function useSpeakingGradingResult(submissionId: string) {
  return useQuery({
    queryKey: ["grading", "speaking", "result", submissionId],
    queryFn: () =>
      api.get<SpeakingGradingResult | null>(
        `/api/v1/grading/speaking/practice_speaking/${submissionId}`,
      ),
    refetchInterval: (q) => (q.state.data?.overallBand != null ? false : 5000),
    retry: false,
  });
}

// ── Writing support ──

export function useWritingSupportMutation(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ level }: { level: number }) =>
      requestWritingSupport(sessionId, level),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["practice", "writing", "history"] });
    },
  });
}
