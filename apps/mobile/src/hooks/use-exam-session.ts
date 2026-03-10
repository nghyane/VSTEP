import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ExamSession, ExamSessionDetail } from "@/types/api";

export function useExamSession(sessionId: string) {
  return useQuery({
    queryKey: ["exam-sessions", sessionId],
    queryFn: () => api.get<ExamSessionDetail>(`/api/exams/sessions/${sessionId}`),
    enabled: !!sessionId,
  });
}

export function useSaveAnswers(sessionId: string) {
  return useMutation({
    mutationFn: (answers: { questionId: string; answer: unknown }[]) =>
      api.put<{ success: boolean; saved: number }>(
        `/api/exams/sessions/${sessionId}`,
        { answers },
      ),
  });
}

export function useAnswerQuestion(sessionId: string) {
  return useMutation({
    mutationFn: (body: { questionId: string; answer: unknown }) =>
      api.post<{ success: boolean }>(
        `/api/exams/sessions/${sessionId}/answer`,
        body,
      ),
  });
}

export function useSubmitExam(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<ExamSession>(`/api/exams/sessions/${sessionId}/submit`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam-sessions", sessionId] });
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}
