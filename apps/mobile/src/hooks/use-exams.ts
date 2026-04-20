// Exam hooks — thin wrappers over API
import { useQuery, useMutation } from "@tanstack/react-query";
import { type ApiResponse, api } from "@/lib/api";

interface Exam {
  id: string;
  title: string;
  level: string;
  duration_minutes: number;
}

export function useExams(_params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ["exams"],
    queryFn: () => api.get<ApiResponse<Exam[]>>("exams"),
    staleTime: 300_000,
  });
}

export function useExamDetail(id: string) {
  return useQuery({
    queryKey: ["exams", id],
    queryFn: () => api.get<ApiResponse<Exam>>(`exams/${id}`),
    enabled: !!id,
  });
}

export function useStartExam() {
  return useMutation({
    mutationFn: (examId: string) => api.post<ApiResponse<{ id: string }>>(`exams/${examId}/sessions`),
  });
}
