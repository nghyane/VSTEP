import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Submission, PaginatedResponse } from "@/types/api";

export function useSubmissions(params?: { page?: number; skill?: string; status?: string }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.skill) qs.set("skill", params.skill);
  if (params?.status) qs.set("status", params.status);
  const query = qs.toString();

  return useQuery({
    queryKey: ["submissions", params],
    queryFn: () => api.get<PaginatedResponse<Submission>>(`/api/v1/exam-sessions${query ? `?${query}` : ""}`),
  });
}
