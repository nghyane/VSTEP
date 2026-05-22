// Shadowing lesson hooks — wrap `practice/speaking/drills` endpoints.
// BE re-purposed `drills` to be shadowing lessons (commit a212844): each drill
// has audio_url + segment list with text/ipa/translation/word_count/timing.
// Mirrors apps/frontend-v3/src/features/practice/queries.ts:
//   shadowingLessonsQuery, shadowingLessonDetailQuery.
//
// Cache key shared with `useSpeakingDrills`/`useSpeakingDrillDetail` (same
// endpoint, same data), so navigating between drill screen and shadowing screen
// reuses cache without duplicate fetch.
import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type {
  ShadowingLesson,
  ShadowingLessonDetail,
} from "@/features/shadowing/types";

export function useShadowingLessons() {
  return useQuery({
    queryKey: ["practice", "speaking", "drills"],
    queryFn: () => api.get<ShadowingLesson[]>("/api/v1/practice/speaking/drills"),
    retry: false,
  });
}

export function useShadowingLessonDetail(id: string) {
  return useQuery({
    queryKey: ["practice", "speaking", "drills", id],
    queryFn: () => api.get<ShadowingLessonDetail>(`/api/v1/practice/speaking/drills/${id}`),
    enabled: !!id,
    retry: false,
  });
}
