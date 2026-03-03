import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse, Question, Skill } from "@/types/api";

export function useQuestions(params?: {
  skill?: Skill;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.skill) searchParams.set("skill", params.skill);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  const qs = searchParams.toString();
  return useQuery({
    queryKey: ["questions", params],
    queryFn: () =>
      api.get<PaginatedResponse<Question>>(
        `/api/questions${qs ? `?${qs}` : ""}`,
      ),
    enabled: !!params?.skill,
  });
}

export function useQuestion(id: string) {
  return useQuery({
    queryKey: ["questions", id],
    queryFn: () => api.get<Question>(`/api/questions/${id}`),
    enabled: !!id,
  });
}
