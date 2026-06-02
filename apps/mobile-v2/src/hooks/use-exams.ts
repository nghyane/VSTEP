import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Exam, ExamDetail, ExamSessionResult } from "@/types/api";

export type { Exam, ExamDetail };

export interface AppConfig {
  profile: {
    maxProfilesPerAccount: number;
  };
  pricing: {
    exam: {
      fullTestCostCoins: number;
      customPerSkillCoins: number;
      maxCostCoins: number;
    };
  };
}

export function useAppConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: () => api.get<AppConfig>("/api/v1/config"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useExams() {
  return useQuery({
    queryKey: ["exams"],
    queryFn: () => api.get<Exam[]>("/api/v1/exams"),
  });
}

export function useExam(id: string) {
  return useQuery({
    queryKey: ["exam", id],
    queryFn: () => api.get<ExamDetail>(`/api/v1/exams/${id}`),
    enabled: !!id,
  });
}

export function useExamSessions(status?: string) {
  const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  return useQuery({
    queryKey: ["exam-sessions", "mine", status ?? "all"],
    queryFn: () => api.get<ExamSessionResult[]>(`/api/v1/exam-sessions${query}`),
  });
}
