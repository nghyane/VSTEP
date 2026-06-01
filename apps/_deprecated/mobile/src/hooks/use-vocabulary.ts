// Vocabulary hooks — thin wrappers over practice queries
import { useQuery } from "@tanstack/react-query";
import { vocabTopicsQuery, vocabTopicDetailQuery } from "@/features/practice/queries";

export function useVocabularyTopics() {
  const { data, ...rest } = useQuery(vocabTopicsQuery);
  return { data: data?.data, ...rest };
}

export function useVocabularyTopic(id: string) {
  const { data, ...rest } = useQuery(vocabTopicDetailQuery(id));
  return { data: data?.data, ...rest };
}
