import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { api } from "@/lib/api";
import { saveDraft, loadDraft, clearDraft, type ExamDraft } from "@/lib/exam-draft";
import type { ExamVersionMcqItem, ExamVersionWritingTask, ExamVersionSpeakingPart } from "@/types/api";

// ── Types ──

export interface ExamSessionData {
  id: string;
  examId: string;
  examVersionId: string;
  mode: "full" | "custom";
  selectedSkills: string[];
  examTitle?: string | null;
  startedAt?: string;
  serverDeadlineAt: string;
  submittedAt: string | null;
  status: "active" | "submitted" | "graded";
  coinsCharged: number;
}

export interface StartSessionResult {
  sessionId: string;
  serverDeadlineAt: string;
  coinsCharged: number;
  status: string;
}

export interface SubmitSessionPayload {
  mcq_answers: McqAnswerPayload[];
  writing_answers?: { task_id: string; text: string; word_count: number }[];
  speaking_answers?: { part_id: string; audio_url: string; duration_seconds: number }[];
}

export interface SubmitSessionResult {
  sessionId: string;
  status: string;
  mcqScore: number;
  mcqTotal: number;
  submittedAt: string;
  writingSubmitted: boolean;
  speakingSubmitted: boolean;
}

export interface ExamServerDraft {
  sessionId: string;
  skillIdx: number;
  mcqAnswers: Record<string, number>;
  writingAnswers: Record<string, string>;
  speakingMarks: Record<string, string>;
  savedAt: string;
}

export interface SaveExamDraftPayload {
  skillIdx: number;
  mcqAnswers: Record<string, number>;
  writingAnswers: Record<string, string>;
  speakingMarks: Record<string, string>;
}

export interface McqAnswerPayload {
  item_ref_type: string;
  item_ref_id: string;
  selected_index: number;
}

// ── Queries ──

export function useExamSession(sessionId: string) {
  return useQuery({
    queryKey: ["exam-sessions", sessionId],
    queryFn: () => api.get<ExamSessionData>(`/api/v1/exam-sessions/${sessionId}`),
    enabled: !!sessionId,
    retry: false,
    staleTime: Infinity,
  });
}

export function useExamDraft(sessionId: string) {
  return useQuery({
    queryKey: ["exam-sessions", sessionId, "draft"],
    queryFn: () => api.get<ExamServerDraft | null>(`/api/v1/exam-sessions/${sessionId}/draft`),
    enabled: !!sessionId,
    retry: false,
    staleTime: 0,
  });
}

// ── Mutations ──

export function useStartExamSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      examId,
      mode,
      selectedSkills,
      timeExtensionFactor,
    }: {
      examId: string;
      mode: "full" | "custom";
      selectedSkills?: string[];
      timeExtensionFactor?: number;
    }) =>
      api.post<StartSessionResult>(`/api/v1/exams/${examId}/sessions`, {
        mode,
        selected_skills: selectedSkills ?? [],
        time_extension_factor: timeExtensionFactor ?? 1.0,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });
}

export function useActiveExamSession() {
  return useQuery({
    queryKey: ["exam-sessions", "active"],
    queryFn: () => api.get<ExamSessionData>("/api/v1/exam-sessions/active"),
    retry: false,
    staleTime: 0,
  });
}

export function useSubmitExamSession(sessionId: string) {
  return useMutation({
    mutationFn: (payload: SubmitSessionPayload) =>
      api.post<SubmitSessionResult>(`/api/v1/exam-sessions/${sessionId}/submit`, payload),
  });
}

export function useSaveExamDraft(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveExamDraftPayload) =>
      api.put<ExamServerDraft>(`/api/v1/exam-sessions/${sessionId}/draft`, payload),
    onSuccess: (draft) => qc.setQueryData(["exam-sessions", sessionId, "draft"], draft),
  });
}

export function useAbandonExamSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      api.post<{ abandoned: boolean }>(`/api/v1/exam-sessions/${sessionId}/abandon`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["exam-sessions"] });
      void qc.invalidateQueries({ queryKey: ["exams"] });
    },
  });
}

export function useLogListeningPlayed(sessionId: string) {
  return useMutation({
    mutationFn: (sectionId: string) =>
      api.post(`/api/v1/exam-sessions/${sessionId}/listening-played`, { section_id: sectionId }),
  });
}

// ── Timer ──

export function useExamTimer(serverDeadlineAt: string): number {
  const deadlineMs = useRef(new Date(serverDeadlineAt).getTime());
  const calc = () => Math.max(0, Math.floor((deadlineMs.current - Date.now()) / 1000));
  const [remaining, setRemaining] = useReducer((_: number, n: number) => n, calc());

  useEffect(() => {
    const id = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(id);
  }, []);

  return remaining;
}

// ── Helpers ──

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

// ── Exam session state machine ──

type ExamPhase = "device-check" | "active" | "submitting" | "submitted";
type SkillKey = "listening" | "reading" | "writing" | "speaking";

const SKILL_ORDER: SkillKey[] = ["listening", "reading", "writing", "speaking"];

interface SpeakingAnswer {
  partId: string;
  audioUrl: string | null;
  durationSeconds: number;
}

interface ExamState {
  phase: ExamPhase;
  skillIdx: number;
  mcqAnswers: Map<string, number>;
  writingAnswers: Map<string, string>;
  speakingDone: Set<string>;
  speakingAnswers: Map<string, SpeakingAnswer>;
  confirmSubmit: boolean;
  confirmNextSkill: boolean;
}

type ExamAction =
  | { type: "START" }
  | { type: "MCQ"; itemId: string; idx: number }
  | { type: "WRITING"; taskId: string; text: string }
  | { type: "SPEAKING_DONE"; partId: string }
  | { type: "SET_SPEAKING_ANSWER"; partId: string; answer: SpeakingAnswer }
  | { type: "RESTORE_DRAFT"; draft: ExamDraft }
  | { type: "NEXT_SKILL" }
  | { type: "SHOW_CONFIRM_SUBMIT" } | { type: "HIDE_CONFIRM_SUBMIT" }
  | { type: "SHOW_CONFIRM_NEXT" } | { type: "HIDE_CONFIRM_NEXT" }
  | { type: "SUBMITTING" } | { type: "SUBMITTED" };

function reducer(state: ExamState, action: ExamAction): ExamState {
  switch (action.type) {
    case "START": return { ...state, phase: "active" };
    case "MCQ": {
      const m = new Map(state.mcqAnswers); m.set(action.itemId, action.idx);
      return { ...state, mcqAnswers: m };
    }
    case "WRITING": {
      const m = new Map(state.writingAnswers); m.set(action.taskId, action.text);
      return { ...state, writingAnswers: m };
    }
    case "SPEAKING_DONE": {
      const s = new Set(state.speakingDone); s.add(action.partId);
      return { ...state, speakingDone: s };
    }
    case "SET_SPEAKING_ANSWER": {
      const m = new Map(state.speakingAnswers); m.set(action.partId, action.answer);
      return { ...state, speakingAnswers: m };
    }
    case "RESTORE_DRAFT":
      return {
        ...state,
        skillIdx: action.draft.skillIdx,
        mcqAnswers: new Map(Object.entries(action.draft.mcqAnswers)),
        writingAnswers: new Map(Object.entries(action.draft.writingAnswers)),
        speakingAnswers: new Map(
          Object.entries(action.draft.speakingMarks)
            .filter(([, audioUrl]) => audioUrl.length > 0)
            .map(([partId, audioUrl]) => [partId, { partId, audioUrl, durationSeconds: 0 }]),
        ),
        speakingDone: new Set(
          Object.entries(action.draft.speakingMarks)
            .filter(([, audioUrl]) => audioUrl.length > 0)
            .map(([partId]) => partId),
        ),
      };
    case "NEXT_SKILL": return { ...state, skillIdx: state.skillIdx + 1, confirmNextSkill: false };
    case "SHOW_CONFIRM_SUBMIT": return { ...state, confirmSubmit: true };
    case "HIDE_CONFIRM_SUBMIT": return { ...state, confirmSubmit: false };
    case "SHOW_CONFIRM_NEXT": return { ...state, confirmNextSkill: true };
    case "HIDE_CONFIRM_NEXT": return { ...state, confirmNextSkill: false };
    case "SUBMITTING": return { ...state, phase: "submitting", confirmSubmit: false };
    case "SUBMITTED": return { ...state, phase: "submitted" };
    default: return state;
  }
}

function buildMcqPayload(
  items: ExamVersionMcqItem[],
  refType: string,
  answers: Map<string, number>,
): McqAnswerPayload[] {
  return items
    .filter((it) => answers.has(it.id))
    .map((it) => ({ item_ref_type: refType, item_ref_id: it.id, selected_index: answers.get(it.id)! }));
}

function toExamDraft(session: ExamSessionData, draft: ExamServerDraft): ExamDraft {
  return {
    sessionId: session.id,
    examId: session.examVersionId,
    skillIdx: draft.skillIdx,
    mcqAnswers: draft.mcqAnswers,
    writingAnswers: draft.writingAnswers,
    speakingMarks: draft.speakingMarks,
    savedAt: draft.savedAt,
  };
}

export function useExamSessionState(
  session: ExamSessionData,
  listeningItems: ExamVersionMcqItem[],
  readingItems: ExamVersionMcqItem[],
  writingTasks: ExamVersionWritingTask[],
  speakingParts: ExamVersionSpeakingPart[],
  onSubmitted: (result: SubmitSessionResult) => void,
) {
  const [state, dispatch] = useReducer(reducer, {
    phase: "device-check",
    skillIdx: 0,
    mcqAnswers: new Map(),
    writingAnswers: new Map(),
    speakingDone: new Set(),
    speakingAnswers: new Map<string, SpeakingAnswer>(),
    confirmSubmit: false,
    confirmNextSkill: false,
  } as ExamState);

  const submitMutation = useSubmitExamSession(session.id);
  const saveDraftMutation = useSaveExamDraft(session.id);
  const serverDraft = useExamDraft(session.id);
  const restoredDraftRef = useRef(false);

  const activeSkills = SKILL_ORDER.filter((sk) => session.selectedSkills.includes(sk));
  const currentSkill = activeSkills[state.skillIdx] ?? activeSkills[0];
  const isLastSkill = state.skillIdx >= activeSkills.length - 1;
  const nextSkill = activeSkills[state.skillIdx + 1] ?? null;

  const hasListening = activeSkills.includes("listening");
  const hasReading = activeSkills.includes("reading");

  useEffect(() => {
    if (restoredDraftRef.current || serverDraft.isLoading) return;
    restoredDraftRef.current = true;
    const restore = async () => {
      const fallbackDraft = await loadDraft(session.id);
      const draft = serverDraft.data
        ? toExamDraft(session, serverDraft.data)
        : fallbackDraft;
      if (draft) dispatch({ type: "RESTORE_DRAFT", draft });
    };
    void restore();
  }, [serverDraft.isLoading, serverDraft.data, session]);

  const scopedMcqTotal = (hasListening ? listeningItems.length : 0) + (hasReading ? readingItems.length : 0);
  const scopedAnsweredMcq = activeSkills.includes("listening")
    ? [...state.mcqAnswers.keys()].filter((id) => listeningItems.some((i) => i.id === id)).length
    : 0;
  const scopedReadingAnswered = activeSkills.includes("reading")
    ? [...state.mcqAnswers.keys()].filter((id) => readingItems.some((i) => i.id === id)).length
    : 0;
  const answeredMcq = scopedAnsweredMcq + scopedReadingAnswered;
  const totalMcq = scopedMcqTotal;

  const doSubmit = useCallback(() => {
    if (state.phase === "submitting" || state.phase === "submitted") return;
    dispatch({ type: "SUBMITTING" });
    const payload: SubmitSessionPayload = {
      mcq_answers: [
        ...buildMcqPayload(listeningItems, "exam_listening_item", state.mcqAnswers),
        ...buildMcqPayload(readingItems, "exam_reading_item", state.mcqAnswers),
      ],
    };
    if (activeSkills.includes("writing")) {
      payload.writing_answers = writingTasks.map((t) => ({
        task_id: t.id,
        text: state.writingAnswers.get(t.id) ?? "",
        word_count: countWords(state.writingAnswers.get(t.id) ?? ""),
      })).filter((a) => a.text.length > 0);
    }
    if (activeSkills.includes("speaking")) {
      payload.speaking_answers = speakingParts
        .map((p) => state.speakingAnswers.get(p.id))
        .filter((a): a is SpeakingAnswer => a != null && a.audioUrl != null)
        .map((a) => ({ part_id: a.partId, audio_url: a.audioUrl!, duration_seconds: a.durationSeconds }));
    }
    submitMutation.mutate(payload, {
      onSuccess: (res) => {
        dispatch({ type: "SUBMITTED" });
        clearDraft(session.id);
        onSubmitted(res);
      },
      onError: () => dispatch({ type: "HIDE_CONFIRM_SUBMIT" }),
    });
  }, [state.phase, state.mcqAnswers, state.writingAnswers, state.speakingAnswers, listeningItems, readingItems, writingTasks, speakingParts, activeSkills, submitMutation, onSubmitted, session.id]);

  // Autosave: persist answers to local storage every 30s
  useEffect(() => {
    const id = setInterval(() => {
      const draft: ExamDraft = {
        sessionId: session.id,
        examId: session.examVersionId,
        skillIdx: state.skillIdx,
        mcqAnswers: Object.fromEntries(state.mcqAnswers),
        writingAnswers: Object.fromEntries(state.writingAnswers),
        speakingMarks: Object.fromEntries(
          Array.from(state.speakingAnswers.entries()).map(([k, v]) => [k, v.audioUrl ?? ""])
        ),
        savedAt: new Date().toISOString(),
      };
      saveDraft(draft);
      saveDraftMutation.mutate({
        skillIdx: draft.skillIdx,
        mcqAnswers: draft.mcqAnswers,
        writingAnswers: draft.writingAnswers,
        speakingMarks: draft.speakingMarks,
      });
    }, 30_000);
    return () => clearInterval(id);
  }, [session.id, session.examVersionId, state.skillIdx, state.mcqAnswers, state.writingAnswers, state.speakingAnswers, saveDraftMutation]);

  return {
    state,
    activeSkills,
    currentSkill,
    isLastSkill,
    nextSkill,
    totalMcq,
    answeredMcq,
    isSubmitting: submitMutation.isPending,
    start: () => dispatch({ type: "START" }),
    answerMcq: (itemId: string, idx: number) => dispatch({ type: "MCQ", itemId, idx }),
    answerWriting: (taskId: string, text: string) => dispatch({ type: "WRITING", taskId, text }),
    markSpeakingDone: (partId: string) => dispatch({ type: "SPEAKING_DONE", partId }),
    setSpeakingAnswer: (partId: string, answer: SpeakingAnswer) => dispatch({ type: "SET_SPEAKING_ANSWER", partId, answer }),
    nextSkillAction: () => dispatch({ type: "NEXT_SKILL" }),
    showConfirmSubmit: () => dispatch({ type: "SHOW_CONFIRM_SUBMIT" }),
    hideConfirmSubmit: () => dispatch({ type: "HIDE_CONFIRM_SUBMIT" }),
    showConfirmNext: () => dispatch({ type: "SHOW_CONFIRM_NEXT" }),
    hideConfirmNext: () => dispatch({ type: "HIDE_CONFIRM_NEXT" }),
    submit: doSubmit,
  };
}
