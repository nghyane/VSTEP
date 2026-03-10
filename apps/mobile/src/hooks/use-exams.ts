import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Exam, ExamSession, ExamSessionWithExam, ExamSessionDetail, PaginatedResponse, ExamType, ExamSkill, QuestionLevel } from "@/types/api";
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

interface UseExamSessionsParams {
  status?: string;
  page?: number;
  limit?: number;
}

export function useExamSessions(params: UseExamSessionsParams = {}) {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.page) search.set("page", String(params.page));
  const qs = search.toString();

  return useQuery({
    queryKey: ["exam-sessions", params],
    queryFn: () => api.get<PaginatedResponse<ExamSessionWithExam>>(`/api/exams/sessions${qs ? `?${qs}` : ""}`),
  });
}

export function useStartExam() {
  return useMutation({
    mutationFn: (examId: string) => api.post<ExamSession>(`/api/exams/${examId}/start`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-sessions"] });
    },
  });
}
