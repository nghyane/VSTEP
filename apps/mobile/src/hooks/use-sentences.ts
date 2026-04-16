import { useQuery, useMutation } from "@tanstack/react-query";
import { MOCK_SENTENCE_TOPICS } from "@/lib/mock";
import type { PaginatedResponse, SentenceTopic, SentenceTopicDetail, SentenceTopicProgress } from "@/types/api";

export function useSentenceTopics(_page = 1, _limit = 20) {
  return useQuery({ queryKey: ["sentences", "topics"], queryFn: async (): Promise<PaginatedResponse<SentenceTopic>> => ({ data: MOCK_SENTENCE_TOPICS, meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }) });
}

export function useSentenceTopic(id: string) {
  return useQuery({ queryKey: ["sentences", "topics", id], queryFn: async () => ({ id, sentences: [] } as any as SentenceTopicDetail), enabled: !!id });
}

export function useSentenceTopicProgress(topicId: string) {
  return useQuery({ queryKey: ["sentences", "progress", topicId], queryFn: async (): Promise<SentenceTopicProgress> => ({ masteredIds: [], totalSentences: 0, masteredCount: 0 } as any), enabled: !!topicId });
}

export function useToggleMastered() {
  return useMutation({ mutationFn: async (_body: { sentenceId: string; mastered: boolean }) => ({ sentenceId: _body.sentenceId, mastered: _body.mastered, lastReviewedAt: new Date().toISOString() }) });
}
