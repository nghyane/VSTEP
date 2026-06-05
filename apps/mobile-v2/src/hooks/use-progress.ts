import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { syncStreakData } from "@/features/streak/streak-store";
import type { OverviewData, Skill, SkillActivityDay, StreakData } from "@/types/api";

export function useOverview() {
  return useQuery({
    queryKey: ["overview"],
    queryFn: () => api.get<OverviewData>("/api/v1/overview"),
  });
}

export function useStreak() {
  const query = useQuery({
    queryKey: ["streak"],
    queryFn: () => api.get<StreakData>("/api/v1/streak"),
  });

  useEffect(() => {
    if (query.data) syncStreakData(query.data);
  }, [query.data]);

  return query;
}

export function useActivityHeatmap() {
  return useQuery({
    queryKey: ["activity-heatmap"],
    queryFn: () => api.get<SkillActivityDay[]>("/api/v1/activity-heatmap"),
  });
}

export function useSpiderChart() {
  return useQuery({
    queryKey: ["overview"],
    queryFn: () => api.get<OverviewData>("/api/v1/overview"),
    select: (data) => data.scores.spider,
  });
}

export function useSkillDetail(skill: Skill) {
  return useQuery({
    queryKey: ["overview"],
    queryFn: () => api.get<OverviewData>("/api/v1/overview"),
    enabled: !!skill,
    select: (data) => ({
      skill,
      score: data.scores.spider?.[skill] ?? null,
    }),
  });
}
