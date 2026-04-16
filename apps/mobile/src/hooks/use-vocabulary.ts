import { useQuery, useMutation } from "@tanstack/react-query";
import { MOCK_VOCAB_TOPICS, MOCK_VOCAB_WORDS } from "@/lib/mock";
import type { VocabularyTopic, VocabularyTopicDetail, TopicProgress, PaginatedResponse } from "@/types/api";

export function useVocabularyTopics(_page = 1, _limit = 50) {
  return useQuery({ queryKey: ["vocabulary-topics"], queryFn: async (): Promise<PaginatedResponse<VocabularyTopic>> => ({ data: MOCK_VOCAB_TOPICS, meta: { page: 1, limit: 50, total: MOCK_VOCAB_TOPICS.length, totalPages: 1 } }) });
}

export function useVocabularyTopic(id: string) {
  return useQuery({
    queryKey: ["vocabulary-topic", id],
    queryFn: async (): Promise<VocabularyTopicDetail> => {
      const topic = MOCK_VOCAB_TOPICS.find((t) => t.id === id) ?? MOCK_VOCAB_TOPICS[0];
      return { ...topic, words: MOCK_VOCAB_WORDS.filter((w) => w.topicId === (topic?.id ?? id)) } as any;
    },
    enabled: !!id,
  });
}

export function useTopicProgress(topicId: string) {
  return useQuery({
    queryKey: ["vocabulary-progress", topicId],
    queryFn: async (): Promise<TopicProgress> => {
      const words = MOCK_VOCAB_WORDS.filter((w) => w.topicId === topicId);
      return { knownWordIds: [], totalWords: words.length, knownCount: 0 } as any;
    },
    enabled: !!topicId,
  });
}

export function useToggleKnown() {
  return useMutation({ mutationFn: async (_body: { wordId: string; known: boolean }) => ({}) });
}
