import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { LearningPathData } from "@/types/api";

export function useLearningPath() {
  return useQuery({
    queryKey: ["learning-path"],
    queryFn: () => api.get<LearningPathData>("/api/v1/learning-path"),
    staleTime: 60_000,
  });
}
