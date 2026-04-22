import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { OverviewData } from "@/types/api";

export function useSkillDetail(skill: string) {
  return useQuery({
    queryKey: ["overview"],
    queryFn: () => api.get<OverviewData>("/api/v1/overview"),
    enabled: !!skill,
    select: (data) => ({
      skill,
      score: data.chart?.[skill as keyof typeof data.chart] as number | null ?? null,
    }),
  });
}
