import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { OverviewData, HeatmapEntry, StreakData } from "@/types/api";

export function useOverview() {
  return useQuery({
    queryKey: ["overview"],
    queryFn: () => api.get<OverviewData>("/api/v1/overview"),
  });
}

export function useStreak() {
  return useQuery({
    queryKey: ["streak"],
    queryFn: () => api.get<StreakData>("/api/v1/streak"),
  });
}

export function useActivityHeatmap() {
  return useQuery({
    queryKey: ["activity-heatmap"],
    queryFn: () => api.get<HeatmapEntry[]>("/api/v1/activity-heatmap"),
  });
}

export function useSpiderChart() {
  return useQuery({
    queryKey: ["overview"],
    queryFn: () => api.get<OverviewData>("/api/v1/overview"),
    select: (data) => data.chart,
  });
}

export function useSkillDetail(skill: string) {
  return useQuery({
    queryKey: ["overview"],
    queryFn: () => api.get<OverviewData>("/api/v1/overview"),
    enabled: !!skill,
    select: (data) => ({
      skill,
      score: (data.chart?.[skill as keyof typeof data.chart] as number | null) ?? null,
    }),
  });
}
