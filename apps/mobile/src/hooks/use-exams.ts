import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Exam, PaginatedResponse } from "@/types/api";

export function useExams() {
  return useQuery({
    queryKey: ["exams"],
    queryFn: () => api.get<PaginatedResponse<Exam>>("/api/exams"),
  });
}
