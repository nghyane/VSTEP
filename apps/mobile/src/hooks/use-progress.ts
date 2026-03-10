import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  ActivityResponse,
  Goal,
  LearningPathResponse,
  ProgressOverview,
  SkillDetail,
  SpiderChart,
} from "@/types/api";

export function useProgress() {
  return useQuery({
    queryKey: ["progress"],
    queryFn: () => api.get<ProgressOverview>("/api/progress"),
  });
}

export function useSpiderChart() {
  return useQuery({
    queryKey: ["progress", "spider-chart"],
    queryFn: () => api.get<SpiderChart>("/api/progress/spider-chart"),
  });
}

export function useSkillDetail(skill: string) {
  return useQuery({
    queryKey: ["progress", skill],
    queryFn: () => api.get<SkillDetail>(`/api/progress/${skill}`),
    enabled: !!skill,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      targetBand: string;
      deadline: string;
      dailyStudyTimeMinutes?: number;
    }) => api.post<Goal>("/api/progress/goals", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      targetBand?: string;
      deadline?: string;
      dailyStudyTimeMinutes?: number;
    }) => api.patch<Goal>(`/api/progress/goals/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ id: string; deleted: boolean }>(`/api/progress/goals/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

export function useActivity(days = 7) {
  return useQuery({
    queryKey: ["activity", days],
    queryFn: () => api.get<ActivityResponse>(`/api/progress/activity?days=${days}`),
  });
}

export function useLearningPath() {
  return useQuery({
    queryKey: ["learning-path"],
    queryFn: () => api.get<LearningPathResponse>("/api/progress/learning-path"),
  });
}
