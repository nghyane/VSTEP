import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { VocabTopic, TopicDetailResponse, SrsQueueResponse } from "./types";

export function useVocabTopics() {
  return useQuery({
    queryKey: ["vocab", "topics"],
    queryFn: () => api.get<VocabTopic[]>("/api/v1/vocab/topics"),
  });
}

export function useVocabTopicDetail(id: string) {
  return useQuery({
    queryKey: ["vocab", "topics", id],
    queryFn: () => api.get<TopicDetailResponse>(`/api/v1/vocab/topics/${id}`),
    enabled: !!id,
  });
}

export function useSrsQueue(limit = 50) {
  return useQuery({
    queryKey: ["vocab", "srs", "queue"],
    queryFn: () => api.get<SrsQueueResponse>(`/api/v1/vocab/srs/queue?limit=${limit}`),
  });
}
