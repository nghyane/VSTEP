import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { api } from "@/lib/api";
import type { ExamVersionMcqItem } from "@/types/api";

// ── Types ──

export interface ExamSessionData {
  id: string;
  examVersionId: string;
  mode: "full" | "custom";
  selectedSkills: string[];
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

export interface SubmitSessionResult {
  sessionId: string;
  status: string;
  mcqScore: number;
  mcqTotal: number;
  submittedAt: string;
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

// ── Mutations ──

export function useStartExamSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, mode }: { examId: string; mode: "full" | "custom" }) =>
      api.post<StartSessionResult>(`/api/v1/exams/${examId}/sessions`, { mode }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });
}

export function useSubmitExamSession(sessionId: string) {
  return useMutation({
    mutationFn: (mcqAnswers: McqAnswerPayload[]) =>
      api.post<SubmitSessionResult>(`/api/v1/exam-sessions/${sessionId}/submit`, {
        mcq_answers: mcqAnswers,
      }),
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

// ── Exam session state machine ──

type ExamPhase = "device-check" | "active" | "submitting" | "submitted";
type SkillKey = "listening" | "reading" | "writing" | "speaking";

const SKILL_ORDER: SkillKey[] = ["listening", "reading", "writing", "speaking"];

interface ExamState {
  phase: ExamPhase;
  skillIdx: number;
  mcqAnswers: Map<string, number>;
  writingAnswers: Map<string, string>;
  speakingDone: Set<string>;
  confirmSubmit: boolean;
  confirmNextSkill: boolean;
}

type ExamAction =
  | { type: "START" }
  | { type: "MCQ"; itemId: string; idx: number }
  | { type: "WRITING"; taskId: string; text: string }
  | { type: "SPEAKING_DONE"; partId: string }
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

export function useExamSessionState(
  session: ExamSessionData,
  listeningItems: ExamVersionMcqItem[],
  readingItems: ExamVersionMcqItem[],
  onSubmitted: (result: SubmitSessionResult) => void,
) {
  const [state, dispatch] = useReducer(reducer, {
    phase: "device-check",
    skillIdx: 0,
    mcqAnswers: new Map(),
    writingAnswers: new Map(),
    speakingDone: new Set(),
    confirmSubmit: false,
    confirmNextSkill: false,
  } as ExamState);

  const submitMutation = useSubmitExamSession(session.id);

  const activeSkills = SKILL_ORDER.filter((sk) => session.selectedSkills.includes(sk));
  const currentSkill = activeSkills[state.skillIdx] ?? activeSkills[0];
  const isLastSkill = state.skillIdx >= activeSkills.length - 1;
  const nextSkill = activeSkills[state.skillIdx + 1] ?? null;
  const totalMcq = listeningItems.length + readingItems.length;
  const answeredMcq = state.mcqAnswers.size;

  const doSubmit = useCallback(() => {
    if (state.phase === "submitting" || state.phase === "submitted") return;
    dispatch({ type: "SUBMITTING" });
    const payload = [
      ...buildMcqPayload(listeningItems, "exam_listening_item", state.mcqAnswers),
      ...buildMcqPayload(readingItems, "exam_reading_item", state.mcqAnswers),
    ];
    submitMutation.mutate(payload, {
      onSuccess: (res) => { dispatch({ type: "SUBMITTED" }); onSubmitted(res); },
    });
  }, [state.phase, state.mcqAnswers, listeningItems, readingItems, submitMutation, onSubmitted]);

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
    nextSkillAction: () => dispatch({ type: "NEXT_SKILL" }),
    showConfirmSubmit: () => dispatch({ type: "SHOW_CONFIRM_SUBMIT" }),
    hideConfirmSubmit: () => dispatch({ type: "HIDE_CONFIRM_SUBMIT" }),
    showConfirmNext: () => dispatch({ type: "SHOW_CONFIRM_NEXT" }),
    hideConfirmNext: () => dispatch({ type: "HIDE_CONFIRM_NEXT" }),
    submit: doSubmit,
  };
}
