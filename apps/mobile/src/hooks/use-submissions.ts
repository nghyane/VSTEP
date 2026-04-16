import { useQuery, useMutation } from "@tanstack/react-query";
import { MOCK_SUBMISSIONS } from "@/lib/mock";
import type { PaginatedResponse, Submission } from "@/types/api";

export function useSubmissions(_params?: { page?: number; skill?: string; status?: string }) {
  return useQuery({ queryKey: ["submissions", _params], queryFn: async (): Promise<PaginatedResponse<Submission>> => ({ data: MOCK_SUBMISSIONS, meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }) });
}

export function useSubmission(id: string) {
  return useQuery({ queryKey: ["submissions", id], queryFn: async () => MOCK_SUBMISSIONS.find((s) => (s as any).id === id) ?? null, enabled: !!id });
}
