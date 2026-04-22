import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Backend-v2 /overview response shape
export interface OverviewData {
  profile: {
    nickname: string;
    targetLevel: string;
    targetDeadline: string | null;
    daysUntilExam: number | null;
  };
  stats: {
    totalTests: number;
    minTestsRequired: number;
    totalStudyMinutes: number;
    streak: number;
    longestStreak: number;
  };
  chart: {
    listening: number | null;
    reading: number | null;
    writing: number | null;
    speaking: number | null;
    sampleSize: number;
  } | null;
}

export interface HeatmapEntry {
  date: string;
  minutes: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  todaySessions: number;
  dailyGoal: number;
  lastActiveDate: string | null;
}

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

// Spider chart — derived from /overview chart field
export function useSpiderChart() {
  return useQuery({
    queryKey: ["overview"],
    queryFn: () => api.get<OverviewData>("/api/v1/overview"),
    select: (data) => data.chart,
  });
}

// Skill detail — no dedicated endpoint in backend-v2 yet, derive from overview
export function useSkillDetail(skill: string) {
  return useQuery({
    queryKey: ["overview"],
    queryFn: () => api.get<OverviewData>("/api/v1/overview"),
    enabled: !!skill,
    select: (data) => ({
      skill,
      score: data.chart?.[skill as keyof typeof data.chart] ?? null,
      recentScores: [] as { score: number; createdAt: string }[],
    }),
  });
}

// Legacy aliases
export const useProgress = useOverview;
export const useActivity = useActivityHeatmap;
