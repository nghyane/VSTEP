import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import type { VocabularyTopic, VocabularyTopicDetail, TopicProgress, PaginatedResponse } from "@/types/api";

export function useVocabularyTopics(page = 1, limit = 50) {
  return useQuery({
    queryKey: ["vocabulary-topics", page, limit],
    queryFn: () => api.get<PaginatedResponse<VocabularyTopic>>(`/api/vocabulary/topics?page=${page}&limit=${limit}`),
  });
}

export function useVocabularyTopic(id: string) {
  return useQuery({
    queryKey: ["vocabulary-topic", id],
    queryFn: () => api.get<VocabularyTopicDetail>(`/api/vocabulary/topics/${id}`),
    enabled: !!id,
  });
}

export function useTopicProgress(topicId: string) {
  return useQuery({
    queryKey: ["vocabulary-progress", topicId],
    queryFn: () => api.get<TopicProgress>(`/api/vocabulary/topics/${topicId}/progress`),
    enabled: !!topicId,
  });
}

export function useToggleKnown() {
  return useMutation({
    mutationFn: ({ wordId, known }: { wordId: string; known: boolean }) =>
      api.put(`/api/vocabulary/words/${wordId}/known`, { known }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vocabulary-progress"] });
    },
  });
}
