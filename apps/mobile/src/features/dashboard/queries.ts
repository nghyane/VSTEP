// Dashboard queries — aligned with frontend-v3 features/dashboard/queries.ts
// Calls real API. Falls back to null when offline/error.
import { queryOptions } from "@tanstack/react-query";
import { type ApiResponse, api } from "@/lib/api";
import type { SkillKey } from "@/lib/skills";

// ─── Raw API types (snake_case from backend) ─────────────────────

export interface OverviewProfile {
  nickname: string;
  target_level: string | null;
  target_deadline: string | null;
  days_until_exam: number | null;
}

export interface OverviewStats {
  total_tests: number;
  min_tests_required: number;
  total_study_minutes: number;
  streak: number;
  longest_streak: number;
}

export interface OverviewChart {
  listening: number | null;
  reading: number | null;
  writing: number | null;
  speaking: number | null;
  sample_size: number;
}

export interface OverviewData {
  profile: OverviewProfile;
  stats: OverviewStats;
  chart: OverviewChart | null;
}

export interface ActivityDay {
  date: string;
  minutes: number;
}

export interface ExamSessionResult {
  id: string;
  mode: string;
  is_full_test: boolean;
  submitted_at: string;
  scores: Record<SkillKey, number | null>;
}

// ─── Queries ─────────────────────────────────────────────────────

export const overviewQuery = queryOptions({
  queryKey: ["overview"],
  queryFn: () => api.get<ApiResponse<OverviewData>>("overview"),
  staleTime: 60_000,
});

export const activityHeatmapQuery = queryOptions({
  queryKey: ["activity-heatmap"],
  queryFn: () => api.get<ApiResponse<ActivityDay[]>>("activity-heatmap"),
  staleTime: 60_000,
});

export const examSessionsQuery = queryOptions({
  queryKey: ["exam-sessions"],
  queryFn: () => api.get<ApiResponse<ExamSessionResult[]>>("exam-sessions"),
  staleTime: 60_000,
});

// ─── Selectors ───────────────────────────────────────────────────

export function selectProfile(raw: ApiResponse<OverviewData>) {
  return raw.data.profile;
}

export function selectStats(raw: ApiResponse<OverviewData>) {
  return raw.data.stats;
}

export function selectSpider(raw: ApiResponse<OverviewData>) {
  return {
    chart: raw.data.chart,
    targetBand: getTargetBand(raw.data.profile.target_level),
    minTests: raw.data.stats.min_tests_required,
    totalTests: raw.data.stats.total_tests,
  };
}

export function selectGap(raw: ApiResponse<OverviewData>) {
  return {
    chart: raw.data.chart,
    targetBand: getTargetBand(raw.data.profile.target_level),
    targetLevel: raw.data.profile.target_level,
  };
}

// ─── VSTEP helpers ───────────────────────────────────────────────

const LEVEL_TO_BAND: Record<string, number> = { A2: 3.5, B1: 4.0, B2: 6.0, C1: 8.5 };

export function getTargetBand(level: string | null): number {
  if (!level) return 6.0;
  return LEVEL_TO_BAND[level] ?? 6.0;
}
