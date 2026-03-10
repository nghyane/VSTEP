import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import type { PracticeNextResponse, Skill } from "@/types/api";

export function usePracticeNext(skill: Skill, part?: number) {
  const search = new URLSearchParams();
  search.set("skill", skill);
  if (part) search.set("part", String(part));

  return useQuery({
    queryKey: ["practice-next", skill, part],
    queryFn: () => api.get<PracticeNextResponse>(`/api/practice/next?${search.toString()}`),
    enabled: !!skill,
  });
}

export function useRefreshPractice() {
  return {
    refresh: (skill: Skill) => queryClient.invalidateQueries({ queryKey: ["practice-next", skill] }),
  };
}

export function useUploadAudio() {
  return useMutation({
    mutationFn: async (file: { uri: string; name: string; type: string }) => {
      const formData = new FormData();
      formData.append("audio", {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
      return api.upload<{ audioKey: string }>("/api/uploads/audio", formData);
    },
  });
}
