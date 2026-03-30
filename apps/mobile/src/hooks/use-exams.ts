import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Exam, PaginatedResponse, ExamType, ExamSkill, QuestionLevel } from "@/types/api";
import { queryClient } from "@/lib/query-client";

interface UseExamsParams {
  type?: ExamType;
  skill?: ExamSkill;
  level?: QuestionLevel;
  limit?: number;
  page?: number;
}

export function useExams(params: UseExamsParams = {}) {
  const search = new URLSearchParams();
  if (params.type) search.set("type", params.type);
  if (params.skill) search.set("skill", params.skill);
  if (params.level) search.set("level", params.level);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.page) search.set("page", String(params.page));
  const qs = search.toString();

  return useQuery({
    queryKey: ["exams", params],
    queryFn: () => api.get<PaginatedResponse<Exam>>(`/api/exams${qs ? `?${qs}` : ""}`),
  });
}

export function useExamDetail(id: string) {
  return useQuery({
    queryKey: ["exams", id],
    queryFn: () => api.get<Exam>(`/api/exams/${id}`),
    enabled: !!id,
  });
}

// useExamSessions lives in use-exam-session.ts (uses correct /api/sessions path)

// Backend returns ExamSessionDetailResource (nested { session, exam, questions, answers })
// Extract session.id so caller can navigate
interface StartExamResult {
  session: { id: string; [key: string]: unknown };
  exam: unknown;
  questions: unknown[];
  answers: unknown[];
}

export function useStartExam() {
  return useMutation({
    mutationFn: async (examId: string) => {
      const res = await api.post<StartExamResult>(`/api/exams/${examId}/start`, {});
      // Return the nested session object with id accessible at top level
      return { id: res.session.id, ...res.session } as { id: string; [key: string]: unknown };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-sessions"] });
    },
  });
}
