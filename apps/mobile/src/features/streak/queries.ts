// Streak queries — server-side (aligned with backend GET /streak)
import { queryOptions, useQuery } from "@tanstack/react-query";
import { type ApiResponse, api } from "@/lib/api";

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  today_sessions: number;
  daily_goal: number;
  last_active_date: string | null;
}

export const streakQuery = queryOptions({
  queryKey: ["streak"],
  queryFn: () => api.get<ApiResponse<StreakData>>("streak"),
  staleTime: 30_000,
});

export function useStreak() {
  const { data, ...rest } = useQuery(streakQuery);
  return { data: data?.data, ...rest };
}
