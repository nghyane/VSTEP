import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse, Submission } from "@/types/api";
import { queryClient } from "@/lib/query-client";

export function useSubmissions(params?: {
  page?: number;
  skill?: string;
  status?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.skill) searchParams.set("skill", params.skill);
  if (params?.status) searchParams.set("status", params.status);
  const qs = searchParams.toString();
  return useQuery({
    queryKey: ["submissions", params],
    queryFn: () =>
      api.get<PaginatedResponse<Submission>>(
        `/api/submissions${qs ? `?${qs}` : ""}`,
      ),
  });
}

export function useSubmission(id: string) {
  return useQuery({
    queryKey: ["submissions", id],
    queryFn: () => api.get<Submission>(`/api/submissions/${id}`),
    enabled: !!id,
  });
}

export function useCreateSubmission() {
  return useMutation({
    mutationFn: (body: { questionId: string; answer: unknown }) =>
      api.post<Submission>("/api/submissions", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}
