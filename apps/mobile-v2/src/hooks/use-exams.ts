import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Exam } from "@/types/api";

export type { Exam };

export function useExams() {
  return useQuery({
    queryKey: ["exams"],
    queryFn: () => api.get<Exam[]>("/api/v1/exams"),
  });
}

export function useExam(id: string) {
  return useQuery({
    queryKey: ["exam", id],
    queryFn: () => api.get<Exam>(`/api/v1/exams/${id}`),
    enabled: !!id,
  });
}
