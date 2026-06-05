import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ── Vocab types (mirror frontend-v3) ──

export interface VocabTopic {
  id: string;
  slug: string;
  groupKey?: string | null;
  name: string;
  description: string | null;
  level: string;
  iconKey: string | null;
  displayOrder: number;
  tasks: string[];
  wordCount?: number;
  learnedCount?: number;
  recommendedTopicId?: string | null;
  adaptiveReason?: string | null;
  adaptiveLabel?: string | null;
}

export const VOCAB_LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
export type VocabLevel = (typeof VOCAB_LEVELS)[number];

export interface LevelProgress {
  level: string;
  topic: VocabTopic;
  wordCount: number;
  learnedCount: number;
}

export interface TopicGroup {
  key: string;
  name: string;
  entry: VocabTopic;
  tasks: string[];
  levels: VocabLevel[];
  levelProgress: Partial<Record<VocabLevel, LevelProgress>>;
  wordCount: number;
  learnedCount: number;
  recommendedTopicId: string | null;
  adaptiveLabel: string | null;
}

const LEVEL_SLUG_SUFFIX = /-(a1|a2|b1|b2|c1)$/i;

export interface FsrsState {
  kind: "new" | "learning" | "review" | "relearning";
  difficulty: number;
  stability: number;
  retrievability: number;
  lapses: number;
}

export function toVocabLevel(value: string | null | undefined): VocabLevel | null {
  const normalized = value?.toUpperCase();
  return VOCAB_LEVELS.find((level) => level === normalized) ?? null;
}

export function topicGroupKey(topic: Pick<VocabTopic, "groupKey" | "slug">): string {
  return topic.groupKey ?? topic.slug.replace(LEVEL_SLUG_SUFFIX, "");
}

export function groupVocabTopics(topics: VocabTopic[]): TopicGroup[] {
  const groups = new Map<string, TopicGroup>();

  for (const topic of topics) {
    const level = toVocabLevel(topic.level);
    const wordCount = topic.wordCount ?? 0;
    const learnedCount = topic.learnedCount ?? 0;
    const progress = { level: level ?? topic.level, topic, wordCount, learnedCount };
    const groupKey = topicGroupKey(topic);
    const existing = groups.get(groupKey);

    if (!existing) {
      groups.set(groupKey, {
        key: groupKey,
        name: topic.name,
        entry: topic,
        tasks: topic.tasks,
        levels: level ? [level] : [],
        levelProgress: level ? { [level]: progress } : {},
        wordCount,
        learnedCount,
        recommendedTopicId: topic.recommendedTopicId ?? null,
        adaptiveLabel: topic.adaptiveLabel ?? null,
      });
      continue;
    }

    existing.entry = earlierTopic(existing.entry, topic);
    existing.tasks = mergeUnique(existing.tasks, topic.tasks);
    if (level) {
      existing.levels = mergeUnique(existing.levels, [level]);
      existing.levelProgress[level] = progress;
    }
    existing.wordCount += wordCount;
    existing.learnedCount += learnedCount;
    existing.recommendedTopicId = existing.recommendedTopicId ?? topic.recommendedTopicId ?? null;
    existing.adaptiveLabel = existing.adaptiveLabel ?? topic.adaptiveLabel ?? null;
  }

  return Array.from(groups.values()).sort((a, b) => a.entry.displayOrder - b.entry.displayOrder);
}

export function recommendedProgress(topic: TopicGroup): LevelProgress {
  const backendRecommendation = progressByTopicId(topic, topic.recommendedTopicId);
  if (backendRecommendation) return backendRecommendation;

  const inProgress = levelProgressList(topic).find((progress) => {
    return progress.learnedCount > 0 && progress.learnedCount < progress.wordCount;
  });
  if (inProgress) return inProgress;

  const firstIncomplete = levelProgressList(topic).find((progress) => progress.learnedCount < progress.wordCount);
  if (firstIncomplete) return firstIncomplete;

  return {
    level: topic.levels[0] ?? topic.entry.level,
    topic: topic.entry,
    wordCount: topic.wordCount,
    learnedCount: topic.learnedCount,
  };
}

export function topicFocusLabel(focus: LevelProgress, topicComplete: boolean): string {
  if (topicComplete) return "Hoàn thành chủ đề";
  if (focus.learnedCount > 0) return "Tiếp tục";
  return "Đề xuất";
}

function earlierTopic(a: VocabTopic, b: VocabTopic): VocabTopic {
  const aLevel = toVocabLevel(a.level);
  const bLevel = toVocabLevel(b.level);
  const aRank = aLevel ? VOCAB_LEVELS.indexOf(aLevel) : VOCAB_LEVELS.length;
  const bRank = bLevel ? VOCAB_LEVELS.indexOf(bLevel) : VOCAB_LEVELS.length;
  if (aRank !== bRank) return aRank < bRank ? a : b;
  return a.displayOrder <= b.displayOrder ? a : b;
}

function levelProgressList(topic: TopicGroup): LevelProgress[] {
  return VOCAB_LEVELS.map((level) => topic.levelProgress[level]).filter((progress) => progress !== undefined);
}

function progressByTopicId(topic: TopicGroup, topicId: string | null): LevelProgress | null {
  if (!topicId) return null;
  return levelProgressList(topic).find((progress) => progress.topic.id === topicId) ?? null;
}

function mergeUnique<T>(a: T[], b: T[]): T[] {
  return Array.from(new Set([...a, ...b]));
}

export interface VocabWord {
  id: string;
  word: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  definition: string;
  example: string | null;
  synonyms: string[];
  collocations: string[];
  wordFamily: string[];
  vstepTip: string | null;
}

export interface WordWithState {
  word: VocabWord;
  state: FsrsState;
}

export type ExerciseKind = "mcq" | "fill_blank" | "word_form";

export interface VocabExercise {
  id: string;
  displayOrder: number;
  kind: ExerciseKind;
  payload: Record<string, unknown>;
}

export interface SrsQueueResponse {
  newCount: number;
  learningCount: number;
  reviewCount: number;
  nextDueAt: string | null;
  items: WordWithState[];
}

// ── Queries ──

export function useVocabTopics() {
  return useQuery({
    queryKey: ["vocab", "topics"],
    queryFn: () => api.get<VocabTopic[]>("/api/v1/vocab/topics"),
  });
}

export function useVocabSrsQueue() {
  return useQuery({
    queryKey: ["vocab", "srs", "queue"],
    queryFn: () => api.get<SrsQueueResponse>("/api/v1/vocab/srs/queue"),
  });
}

export interface TopicDetailResponse {
  topic: VocabTopic;
  words: WordWithState[];
  exercises: VocabExercise[];
}

export function useVocabTopicDetail(id: string) {
  return useQuery({
    queryKey: ["vocab", "topics", id],
    queryFn: () => api.get<TopicDetailResponse>(`/api/v1/vocab/topics/${id}`),
    enabled: !!id,
  });
}

// ── SRS review mutation with invalidation ──

export interface SrsReviewPayload {
  wordId: string;
  rating: number;
}

export function useSrsReviewMutation(topicId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SrsReviewPayload) =>
      api.post("/api/v1/vocab/srs/review", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vocab", "srs"] });
      if (topicId) {
        qc.invalidateQueries({ queryKey: ["vocab", "topics", topicId] });
      }
    },
  });
}
