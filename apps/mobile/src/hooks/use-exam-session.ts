import { useQuery, useMutation } from "@tanstack/react-query";
import { MOCK_SESSIONS } from "@/lib/mock";
import type { ExamSession, ExamSessionWithExam, PaginatedResponse } from "@/types/api";

export interface FlatSessionDetail extends Record<string, any> {
  exam: Record<string, unknown> | null;
}

export function useExamSession(sessionId: string) {
  return useQuery({
    queryKey: ["exam-sessions", sessionId],
    queryFn: async (): Promise<FlatSessionDetail> => {
      const s = MOCK_SESSIONS.find((s) => s.id === sessionId);
      return { ...s, exam: s?.exam ?? null, questions: [], answers: [], submissions: [], status: s?.status ?? "completed" } as any;
    },
    enabled: !!sessionId,
  });
}

export function useExamSessions(params: { status?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["exam-sessions", params],
    queryFn: async (): Promise<PaginatedResponse<ExamSessionWithExam>> => {
      const filtered = params.status ? MOCK_SESSIONS.filter((s) => s.status === params.status) : MOCK_SESSIONS;
      const limited = params.limit ? filtered.slice(0, params.limit) : filtered;
      return { data: limited, meta: { page: 1, limit: 20, total: limited.length, totalPages: 1 } };
    },
  });
}

export function useSaveAnswers(_sessionId: string) {
  return useMutation({ mutationFn: async (_answers: any) => ({ success: true, saved: 0 }) });
}

export function useAnswerQuestion(_sessionId: string) {
  return useMutation({ mutationFn: async (_body: any) => ({ success: true }) });
}

export function useSubmitExam(_sessionId: string) {
  return useMutation({ mutationFn: async () => ({} as ExamSession) });
}
