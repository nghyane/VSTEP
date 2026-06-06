import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useReducer, useRef } from "react";
import { ApiError, api, getApiErrorMessage } from "@/lib/api";

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

export type ExerciseFeedbackContentType = "practice_listening_exercise" | "practice_reading_exercise";

export interface ExerciseFeedbackPayload {
  contentType: ExerciseFeedbackContentType;
  contentId: string;
  rating: number;
  comment?: string;
}

export interface ExerciseFeedback {
  id: string;
  contentType: ExerciseFeedbackContentType;
  contentId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
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
  submissionId: string; attemptId: string; wordCount: number; submittedAt: string; gradingStatus: string;
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
  sampleMarkers: WritingSampleMarker[];
  outlineSections: WritingOutlineSection[];
  templateSections: WritingTemplateSection[];
  estimatedMinutes: number | null;
}

export interface WritingSampleMarker {
  id: string;
  match: string;
  occurrence: number;
  side: string;
  color: "yellow" | "blue" | "pink" | string;
  label: string;
  detail: string | null;
}

export interface WritingHistoryItem {
  id: string;
  attemptId: string | null;
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
  attemptId: string | null;
  rubricScores: Record<string, number> | null;
  overallBand: number | null;
  feedback: AssessmentFeedback | null;
  hasDetailedFeedback: boolean;
  strengths: string[];
  improvements: { message: string; explanation: string }[];
  rewrites: { original: string; improved: string; reason: string }[];
  annotations: unknown[];
  paragraphFeedback: Record<string, string>[];
  teacherGradingRequest: TeacherGradingRequestState | null;
  feedbackRequest: FeedbackRequestState | null;
  feedbackGenerated: AssessmentFeedback | null;
}

export interface SpeakingTopic {
  name: string;
  questions?: string[];
}

export interface SpeakingTask {
  id: string; slug: string; title: string;
  part: number; taskType: string; speakingSeconds: number;
}

export interface SpeakingTaskDetail {
  id: string; slug: string; title: string;
  part: number; taskType: string; speakingSeconds: number;
  content: { topics?: SpeakingTopic[] } | null;
}

export interface SpeakingDrill {
  id: string; slug: string; title: string;
  level: string; estimatedMinutes: number | null;
  segmentCount: number;
}

export interface SpeakingDrillDetail {
  id: string; slug: string; title: string;
  level: string;
  audioUrl: string;
  segments: SpeakingDrillSegment[];
}

export interface SpeakingDrillSegment {
  id: string;
  index: number;
  text: string;
  ipa: string;
  translation: string;
  wordCount: number;
  audioStart: number;
  audioEnd: number;
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
  profanity?: {
    found: boolean;
    words: string[];
    count: number;
  };
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
  attemptId: string | null;
  criterionScores: CriterionScore[];
  overallBand: number | null;
  feedback: AssessmentFeedback | null;
  hasDetailedFeedback: boolean;
  strengths: string[];
  improvements: { message: string; explanation: string }[];
  pronunciationReport: { accuracyScore: number } | null;
  transcript: string | null;
  teacherGradingRequest: TeacherGradingRequestState | null;
  feedbackRequest: FeedbackRequestState | null;
  feedbackGenerated: AssessmentFeedback | null;
}

export interface CriterionScore {
  key: string;
  score: number;
  weight?: number;
}

interface AssessmentFeedback {
  strengths?: unknown;
  improvements?: unknown;
  evidenceNotes?: unknown;
  rewrites?: unknown;
}

export type { AssessmentFeedback };

interface AssessmentResultPayload {
  criterionScores?: CriterionScore[];
  overallBand: number | null;
  feedback?: AssessmentFeedback | null;
  annotations?: unknown[];
  paragraphFeedback?: Record<string, string>[];
  pronunciationReport?: { accuracyScore?: number } | null;
  transcript?: string | null;
}

export type TeacherGradingRequestStatus = "none" | "pending_assignment" | "assigned" | "in_progress" | "completed" | "cancelled" | "rejected";

export interface TeacherGradingResultState {
  id: string;
  overallBand: number;
  criterionScores: CriterionScore[];
  feedback: AssessmentFeedback | null;
  submittedAt: string | null;
  source: "teacher";
}

export interface TeacherGradingRequestState {
  canRequest: boolean;
  requested: boolean;
  requestId: string | null;
  status: TeacherGradingRequestStatus;
  assignedTeacher: { id: string; fullName: string | null; email: string | null } | null;
  requestedAt: string | null;
  assignedAt: string | null;
  completedAt: string | null;
  teacherResult: TeacherGradingResultState | null;
}

export interface TeacherGradingRequestResponse {
  id: string;
  status: TeacherGradingRequestStatus;
}

// ── AI Coaching feedback ──

export interface FeedbackRequestState {
  canRequest: boolean;
  requested: boolean;
  costCoins: number;
  status: string;
}

export interface RequestFeedbackResponse {
  submissionId: string;
  status: string;
  costCoins: number;
  charged: boolean;
  feedback: AssessmentFeedback | null;
}

interface PracticeGradingResultResponse {
  attemptId?: string;
  data: AssessmentResultPayload | null;
  teacherGradingRequest?: TeacherGradingRequestState;
  feedbackRequest?: FeedbackRequestState;
}

interface AssessmentViewResponse {
  attemptId: string;
  status: "pending" | "processing" | "ready" | "failed";
  result: AssessmentResultPayload | null;
  teacherGradingRequest: TeacherGradingRequestState;
  feedbackRequest?: FeedbackRequestState;
}

export interface PresignUploadResponse {
  uploadUrl: string;
  audioKey: string;
  audioUrl: string;
}

export interface AudioUploadMeta {
  contentType: string;
  extension: string;
}

export interface TranscribeAudioResponse {
  transcript: string;
  confidence: number;
  durationMs: number;
}

export function audioUploadMetaFromUri(uri: string): AudioUploadMeta {
  const clean = uri.split("?")[0] ?? uri;
  const ext = clean.includes(".") ? clean.split(".").pop()?.toLowerCase() : null;
  const extension = ext && /^[a-z0-9]{2,8}$/.test(ext) ? ext : "m4a";
  const contentType = (() => {
    switch (extension) {
      case "webm":
        return "audio/webm";
      case "ogg":
      case "opus":
        return "audio/ogg";
      case "wav":
        return "audio/wav";
      case "mp3":
      case "mpeg":
        return "audio/mpeg";
      case "mp4":
      case "m4a":
      case "aac":
      default:
        return "audio/mp4";
    }
  })();

  return { contentType, extension };
}

export async function presignUpload(
  context: "practice_speaking" | "exam_speaking" = "practice_speaking",
  meta: AudioUploadMeta = { contentType: "audio/webm", extension: "webm" },
) {
  return api.post<PresignUploadResponse>("/api/v1/audio/presign-upload", {
    context,
    contentType: meta.contentType,
    extension: meta.extension,
  });
}

export async function presignDownload(audioKey: string) {
  return api.post<{ downloadUrl: string }>("/api/v1/audio/presign-download", { audioKey });
}

export async function transcribeAudioFile(audioUri: string, language = "en-US") {
  const meta = audioUploadMetaFromUri(audioUri);
  const form = new FormData();
  form.append("language", language);
  form.append("audio", {
    uri: audioUri,
    name: `speech.${meta.extension}`,
    type: meta.contentType,
  } as unknown as Blob);

  return api.postForm<TranscribeAudioResponse>("/api/v1/audio/transcribe", form);
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
    submitError: mutation.error ? getApiErrorMessage(mutation.error) : null,
    answeredCount: Object.keys(state.answers).length,
    select: (questionId: string, index: number) => {
      mutation.reset();
      dispatch({ type: "select", questionId, index });
    },
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

export async function submitExerciseFeedback(payload: ExerciseFeedbackPayload) {
  return api.post<ExerciseFeedback>("/api/v1/feedback", payload);
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

export async function submitSpeakingSession(sessionId: string, audioKey: string, durationSeconds: number) {
  return api.post<{ submissionId: string; gradingStatus: string }>(
    `/api/v1/practice/speaking/vstep-sessions/${sessionId}/submit`,
    { audioKey, durationSeconds },
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
    queryFn: () => api.get<GradingJobStatus>(`/api/v1/assessment-jobs/${jobId}`),
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status === "ready" || status === "failed" ? false : 3000;
    },
    retry: false,
  });
}

// ── Writing grading result ──

export function useWritingGradingResult(attemptId: string) {
  const validAttemptId = isUuid(attemptId) ? attemptId : "";
  return useQuery({
    queryKey: ["assessment-attempts", validAttemptId, "view"],
    queryFn: async () => {
      const response = await api.get<AssessmentViewResponse>(`/api/v1/assessment-attempts/${validAttemptId}/view`);
      return normalizeWritingGradingResult(response);
    },
    refetchInterval: (q) => (q.state.data?.overallBand != null ? false : 5000),
    enabled: !!validAttemptId,
    retry: false,
  });
}

export function useSpeakingGradingResult(id: string, source: "submission" | "attempt" = "submission") {
  return useQuery({
    queryKey: [source === "attempt" ? "assessment-attempts" : "practice", "speaking", "result", id],
    queryFn: async () => {
      const response = await getSpeakingGradingResponse(id, source);
      return normalizeSpeakingGradingResult(response);
    },
    refetchInterval: (q) => (q.state.data?.overallBand != null ? false : 5000),
    enabled: !!id,
    retry: false,
  });
}

export async function requestTeacherGrading(attemptId: string) {
  return api.post<TeacherGradingRequestResponse>(`/api/v1/assessment-attempts/${attemptId}/teacher-grading-request`, {});
}

export async function requestWritingFeedback(attemptId: string) {
  return api.post<RequestFeedbackResponse>(`/api/v1/assessment-attempts/${attemptId}/feedback`, {});
}

async function getSpeakingGradingResponse(id: string, source: "submission" | "attempt") {
  if (source === "attempt") {
    return api.get<AssessmentViewResponse>(`/api/v1/assessment-attempts/${id}/view`);
  }

  try {
    return await api.get<PracticeGradingResultResponse>(`/api/v1/practice/speaking/submissions/${id}/result`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return api.get<AssessmentViewResponse>(`/api/v1/assessment-attempts/${id}/view`);
    }
    throw error;
  }
}

function normalizeWritingGradingResult(response: PracticeGradingResultResponse | AssessmentViewResponse): WritingGradingResult | null {
  const result = "result" in response ? response.result : response.data;
  if (!result) return null;

  const feedback = result.feedback;
  const improvementItems = hasFeedbackItems(feedback?.improvements)
    ? feedback?.improvements
    : feedback?.evidenceNotes;

  return {
    attemptId: "attemptId" in response ? response.attemptId ?? null : null,
    rubricScores: normalizeWritingRubricScores(result.criterionScores),
    overallBand: result.overallBand,
    feedback: feedback ?? null,
    hasDetailedFeedback: hasDetailedFeedback(feedback),
    strengths: normalizeTextItems(feedback?.strengths),
    improvements: normalizeImprovementItems(improvementItems),
    rewrites: normalizeRewriteItems(feedback?.rewrites),
    annotations: result.annotations ?? [],
    paragraphFeedback: result.paragraphFeedback ?? [],
    teacherGradingRequest: response.teacherGradingRequest ?? null,
    feedbackRequest: response.feedbackRequest ?? null,
    feedbackGenerated: null,
  };
}

function normalizeSpeakingGradingResult(response: PracticeGradingResultResponse | AssessmentViewResponse): SpeakingGradingResult | null {
  const result = "result" in response ? response.result : response.data;
  if (!result) return null;

  const feedback = result.feedback;
  const improvementItems = hasFeedbackItems(feedback?.improvements)
    ? feedback?.improvements
    : feedback?.evidenceNotes;

  return {
    attemptId: "attemptId" in response ? response.attemptId ?? null : null,
    overallBand: result.overallBand,
    criterionScores: result.criterionScores ?? [],
    feedback: feedback ?? null,
    hasDetailedFeedback: hasDetailedFeedback(feedback),
    strengths: normalizeTextItems(feedback?.strengths),
    improvements: normalizeImprovementItems(improvementItems),
    pronunciationReport: normalizePronunciationReport(result),
    transcript: result.transcript ?? null,
    teacherGradingRequest: response.teacherGradingRequest ?? null,
    feedbackRequest: response.feedbackRequest ?? null,
    feedbackGenerated: null,
  };
}

function normalizeWritingRubricScores(scores: CriterionScore[] | undefined): Record<string, number> | null {
  const rubricScores: Record<string, number> = {};
  for (const criterion of scores ?? []) {
    rubricScores[writingRubricKey(criterion.key)] = criterion.score;
  }

  return Object.keys(rubricScores).length > 0 ? rubricScores : null;
}

function writingRubricKey(key: string): string {
  switch (key) {
    case "task_fulfillment":
    case "taskFulfillment":
    case "taskAchievement":
      return "taskAchievement";
    case "organization":
    case "coherence":
      return "coherence";
    case "vocabulary":
    case "lexical":
      return "lexical";
    default:
      return key;
  }
}

function normalizeTextItems(items: unknown): string[] {
  return normalizeFeedbackItems(items)
    .map((item) => {
      if (typeof item === "string") return item;
      if (!isRecord(item)) return "";
      return stringValue(item.message) ?? stringValue(item.label) ?? "";
    })
    .filter((item) => item.trim().length > 0);
}

function normalizeImprovementItems(items: unknown) {
  return normalizeFeedbackItems(items)
    .map((item) => {
      if (typeof item === "string") return { message: item, explanation: "" };
      if (!isRecord(item)) return { message: "", explanation: "" };
      return {
        message: stringValue(item.message) ?? stringValue(item.label) ?? "",
        explanation: stringValue(item.explanation) ?? stringValue(item.detail) ?? "",
      };
    })
    .filter((item) => item.message.trim().length > 0);
}

function normalizeRewriteItems(items: unknown) {
  return normalizeFeedbackItems(items)
    .map((item) => {
      if (typeof item === "string") return { original: "", improved: item, reason: "" };
      if (!isRecord(item)) return { original: "", improved: "", reason: "" };
      return {
        original: stringValue(item.original) ?? "",
        improved: stringValue(item.improved) ?? "",
        reason: stringValue(item.reason) ?? "",
      };
    })
    .filter((item) => item.original.trim().length > 0 || item.improved.trim().length > 0);
}

function hasFeedbackItems(items: unknown): boolean {
  return normalizeFeedbackItems(items).length > 0;
}

function hasDetailedFeedback(feedback: AssessmentFeedback | null | undefined): boolean {
  return (
    hasFeedbackItems(feedback?.strengths) ||
    hasFeedbackItems(feedback?.improvements) ||
    hasFeedbackItems(feedback?.rewrites)
  );
}

function normalizeFeedbackItems(items: unknown): unknown[] {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (!isRecord(items)) return [items];
  if (isFeedbackItemRecord(items)) return [items];
  return Object.values(items);
}

function isFeedbackItemRecord(item: Record<string, unknown>): boolean {
  return (
    typeof item.message === "string" ||
    typeof item.explanation === "string" ||
    typeof item.label === "string" ||
    typeof item.detail === "string" ||
    typeof item.original === "string" ||
    typeof item.improved === "string" ||
    typeof item.reason === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizePronunciationReport(result: AssessmentResultPayload): { accuracyScore: number } | null {
  const accuracyScore = result.pronunciationReport?.accuracyScore;
  return typeof accuracyScore === "number" ? { accuracyScore } : null;
}

function isUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
