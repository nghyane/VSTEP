import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { OverviewData, Skill } from "@/types/api";

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
