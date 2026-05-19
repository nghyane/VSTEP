// Shadowing progress hooks — wire mobile to BE shadowing progress endpoints.
// Mirrors apps/frontend-v3/src/features/practice/shadowing-progress.ts.
//
// Endpoints (apps/backend-v2/routes/api.php):
//   GET  /api/v1/practice/speaking/shadowing/progress
//   POST /api/v1/practice/speaking/shadowing/progress  body { lesson_id, segment_index, accuracy_percent }
//
// API client transforms snake_case <-> camelCase automatically, so:
// - Query returns `Record<string, { segmentIndex, accuracyPercent }[]>`
// - Mutation accepts `{ lessonId, segmentIndex, accuracyPercent }`
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { ShadowingProgressMap } from "@/features/shadowing/types";

const PROGRESS_KEY = ["practice", "speaking", "shadowing", "progress"] as const;

export function useShadowingProgress() {
  return useQuery({
    queryKey: PROGRESS_KEY,
    queryFn: () => api.get<ShadowingProgressMap>("/api/v1/practice/speaking/shadowing/progress"),
    retry: false,
  });
}

interface MarkDoneInput {
  lessonId: string;
  segmentIndex: number;
  accuracyPercent: number;
}

export function useMarkShadowingDone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MarkDoneInput) =>
      api.post<{ lessonId: string; segmentIndex: number; accuracyPercent: number }>(
        "/api/v1/practice/speaking/shadowing/progress",
        input,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROGRESS_KEY });
    },
  });
}
