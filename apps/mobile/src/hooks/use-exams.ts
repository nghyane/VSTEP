import { useQuery, useMutation } from "@tanstack/react-query";
import { MOCK_EXAMS } from "@/lib/mock";
import type { Exam, PaginatedResponse, ExamType, ExamSkill, QuestionLevel } from "@/types/api";

interface UseExamsParams {
  type?: ExamType;
  skill?: ExamSkill;
  level?: QuestionLevel;
  limit?: number;
  page?: number;
}

export function useExams(_params: UseExamsParams = {}) {
  return useQuery({ queryKey: ["exams", _params], queryFn: async (): Promise<PaginatedResponse<Exam>> => ({ data: MOCK_EXAMS, meta: { page: 1, limit: 20, total: MOCK_EXAMS.length, totalPages: 1 } }) });
}

export function useExamDetail(id: string) {
  return useQuery({ queryKey: ["exams", id], queryFn: async () => MOCK_EXAMS.find((e) => e.id === id) ?? MOCK_EXAMS[0], enabled: !!id });
}

export function useStartExam() {
  return useMutation({ mutationFn: async (_examId: string) => ({ id: "mock-session-new", status: "in_progress" } as any) });
}
