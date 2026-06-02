import type { VocabTopic } from "#/features/vocab/types"
import { ENTRY_LEVELS, parseVstepLevel, type VstepLevel } from "#/lib/vstep"

const LEVEL_SLUG_SUFFIX = /-(a1|a2|b1|b2|c1)$/i

export type VocabLevel = VstepLevel

export interface LevelProgress {
	level: string
	topic: VocabTopic
	wordCount: number
	learnedCount: number
}

export interface TopicGroup {
	key: string
	name: string
	entry: VocabTopic
	tasks: string[]
	levels: VocabLevel[]
	levelProgress: Partial<Record<VocabLevel, LevelProgress>>
	wordCount: number
	learnedCount: number
	recommendedTopicId: string | null
	adaptiveLabel: string | null
}

export function toVocabLevel(value: string | null | undefined): VocabLevel | null {
	return parseVstepLevel(value)
}

export function groupVocabTopics(topics: VocabTopic[]): TopicGroup[] {
	const groups = new Map<string, TopicGroup>()

	for (const topic of topics) {
		const level = toVocabLevel(topic.level)
		const wordCount = topic.word_count ?? 0
		const learnedCount = topic.learned_count ?? 0
		const progress = { level: level ?? topic.level, topic, wordCount, learnedCount }
		const groupKey = topicGroupKey(topic)
		const existing = groups.get(groupKey)

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
				recommendedTopicId: topic.recommended_topic_id ?? null,
				adaptiveLabel: topic.adaptive_label ?? null,
			})
			continue
		}

		existing.entry = earlierTopic(existing.entry, topic)
		existing.tasks = mergeUnique(existing.tasks, topic.tasks)
		if (level) {
			existing.levels = mergeUnique(existing.levels, [level])
			existing.levelProgress[level] = progress
		}
		existing.wordCount += wordCount
		existing.learnedCount += learnedCount
		existing.recommendedTopicId = existing.recommendedTopicId ?? topic.recommended_topic_id ?? null
		existing.adaptiveLabel = existing.adaptiveLabel ?? topic.adaptive_label ?? null
	}

	return Array.from(groups.values()).sort((a, b) => a.entry.display_order - b.entry.display_order)
}

export function topicGroupKey(topic: Pick<VocabTopic, "group_key" | "slug">): string {
	return topic.group_key ?? topic.slug.replace(LEVEL_SLUG_SUFFIX, "")
}

export function recommendedProgress(topic: TopicGroup): LevelProgress {
	const backendRecommendation = progressByTopicId(topic, topic.recommendedTopicId)
	if (backendRecommendation) return backendRecommendation

	const inProgress = levelProgressList(topic).find((progress) => {
		return progress.learnedCount > 0 && progress.learnedCount < progress.wordCount
	})
	if (inProgress) return inProgress

	const firstIncomplete = levelProgressList(topic).find(
		(progress) => progress.learnedCount < progress.wordCount,
	)
	if (firstIncomplete) return firstIncomplete

	return {
		level: topic.levels[0] ?? topic.entry.level,
		topic: topic.entry,
		wordCount: topic.wordCount,
		learnedCount: topic.learnedCount,
	}
}

export function topicFocusLabel(focus: LevelProgress, topicComplete: boolean): string {
	if (topicComplete) return "Hoàn thành chủ đề"
	if (focus.learnedCount > 0) return "Tiếp tục"
	return "Đề xuất"
}

export function levelRank(level: VocabLevel): number {
	return ENTRY_LEVELS.indexOf(level)
}

function earlierTopic(a: VocabTopic, b: VocabTopic): VocabTopic {
	const aLevel = toVocabLevel(a.level)
	const bLevel = toVocabLevel(b.level)
	const aRank = aLevel ? levelRank(aLevel) : ENTRY_LEVELS.length
	const bRank = bLevel ? levelRank(bLevel) : ENTRY_LEVELS.length
	if (aRank !== bRank) return aRank < bRank ? a : b
	return a.display_order <= b.display_order ? a : b
}

function levelProgressList(topic: TopicGroup): LevelProgress[] {
	return ENTRY_LEVELS.map((level) => topic.levelProgress[level]).filter((progress) => progress !== undefined)
}

function mergeUnique<T>(a: T[], b: T[]): T[] {
	return Array.from(new Set([...a, ...b]))
}

function progressByTopicId(topic: TopicGroup, topicId: string | null): LevelProgress | null {
	if (!topicId) return null
	return levelProgressList(topic).find((progress) => progress.topic.id === topicId) ?? null
}
