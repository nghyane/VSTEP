import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Exam, ExamDetail } from "@/types/api";

export type { Exam, ExamDetail };

export interface AppConfig {
  profile: {
    maxProfilesPerAccount: number;
  };
  support?: {
    zaloPhone?: string | null;
  };
  pricing: {
    exam: {
      fullTestCostCoins: number;
      customPerSkillCoins: number;
      maxCostCoins: number;
    };
    practice?: {
      feedbackCostCoins: number;
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
    queryFn: async () => {
      const res = await api.get<Exam[] | { data: Exam[] }>("/api/v1/exams?per_page=50");
      return Array.isArray(res) ? res : res.data;
    },
  });
}

export function useExam(id: string) {
  return useQuery({
    queryKey: ["exam", id],
    queryFn: () => api.get<ExamDetail>(`/api/v1/exams/${id}`),
    enabled: !!id,
  });
}
