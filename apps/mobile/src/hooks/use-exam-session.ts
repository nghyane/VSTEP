import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ExamSession, ExamSessionDetail, ExamSessionWithExam, PaginatedResponse, SessionQuestion, SessionAnswer } from "@/types/api";

// ---------------------------------------------------------------------------
// Backend returns nested { session, exam, questions, answers, submissions, progress }
// Flatten into ExamSessionDetail with exam embedded
// ---------------------------------------------------------------------------

interface SessionDetailResponse {
  session: Record<string, unknown>;
  exam?: Record<string, unknown>;
  questions?: SessionQuestion[];
  answers?: SessionAnswer[];
  submissions?: unknown[];
  progress?: { answered: number; total: number };
}

export interface FlatSessionDetail extends ExamSessionDetail {
  exam: Record<string, unknown> | null;
}

function flattenSessionDetail(raw: unknown): FlatSessionDetail {
  const res = raw as SessionDetailResponse;
  if (res?.session) {
    return {
      ...res.session,
      exam: res.exam ?? null,
      questions: res.questions ?? [],
      answers: res.answers ?? [],
      submissions: res.submissions ?? [],
    } as unknown as FlatSessionDetail;
  }
  return { ...(raw as any), exam: null, submissions: [] } as FlatSessionDetail;
}

// ---------------------------------------------------------------------------
// Hooks — all paths use /api/sessions (NOT /api/exams/sessions)
// ---------------------------------------------------------------------------

const GRADING_POLL_MS = 5_000;

function hasGradingInProgress(data: FlatSessionDetail | undefined): boolean {
  if (!data?.submissions?.length) return false;
  return data.submissions.some((s: any) => s.status === "pending" || s.status === "processing");
}

export function useExamSession(sessionId: string) {
  return useQuery({
    queryKey: ["exam-sessions", sessionId],
    queryFn: async () => {
      const raw = await api.get<unknown>(`/api/sessions/${sessionId}`);
      return flattenSessionDetail(raw);
    },
    enabled: !!sessionId,
    refetchInterval: (query) => (hasGradingInProgress(query.state.data) ? GRADING_POLL_MS : false),
  });
}

export function useExamSessions(params: { status?: string; page?: number; limit?: number } = {}) {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.page) search.set("page", String(params.page));
  const qs = search.toString();

  return useQuery({
    queryKey: ["exam-sessions", params],
    queryFn: () => api.get<PaginatedResponse<ExamSessionWithExam>>(`/api/sessions${qs ? `?${qs}` : ""}`),
  });
}

export function useSaveAnswers(sessionId: string) {
  return useMutation({
    mutationFn: (answers: { questionId: string; answer: unknown }[]) =>
      api.put<{ success: boolean; saved: number }>(
        `/api/sessions/${sessionId}`,
        { answers },
      ),
  });
}

export function useAnswerQuestion(sessionId: string) {
  return useMutation({
    mutationFn: (body: { questionId: string; answer: unknown }) =>
      api.post<{ success: boolean }>(
        `/api/sessions/${sessionId}/answer`,
        body,
      ),
  });
}

export function useSubmitExam(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const raw = await api.post<unknown>(`/api/sessions/${sessionId}/submit`);
      return flattenSessionDetail(raw) as unknown as ExamSession;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam-sessions"] });
      qc.invalidateQueries({ queryKey: ["progress"] });
      qc.invalidateQueries({ queryKey: ["submissions"] });
    },
  });
}
