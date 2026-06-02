import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { LevelFilters, toLevel } from "#/features/practice/components/LevelFilters"
import { ExerciseModes } from "#/features/vocab/components/ExerciseModes"
import { WordList } from "#/features/vocab/components/WordList"
import { vocabTopicDetailQuery, vocabTopicsQuery } from "#/features/vocab/queries"
import { topicGroupKey } from "#/features/vocab/topic-adaptive"
import type { VocabTopic } from "#/features/vocab/types"
import { buildPracticeItems } from "#/features/vocab/use-practice-session"

export const Route = createFileRoute("/_app/luyen-tap/tu-vung/$topicId")({
	component: TopicDetailPage,
})

function TopicDetailPage() {
	const { topicId } = Route.useParams()
	const navigate = useNavigate()
	const { data, isLoading } = useQuery(vocabTopicDetailQuery(topicId))
	const { data: topicsData } = useQuery(vocabTopicsQuery)

	if (isLoading) return <Header title="Từ vựng" backTo="/luyen-tap/tu-vung" />
	if (!data?.data?.topic) return null

	const { topic, words } = data.data
	const hasFillBlank = buildPracticeItems(words, "fill_blank").length > 0
	const currentLevel = toLevel(topic.level)
	const groupKey = topicGroupKey(topic)
	const siblingTopics = (topicsData?.data ?? [])
		.filter((item) => topicGroupKey(item) === groupKey)
		.sort((a, b) => a.display_order - b.display_order)
	const availableLevels = availableTopicLevels(siblingTopics, currentLevel)
	const progressSummary = topicProgressSummary(topic, words.length, siblingTopics)

	return (
		<>
			<Header title={topic.name} backTo="/luyen-tap/tu-vung" />
			<div className="px-10 pb-12">
				<div className="grid gap-6 lg:grid-cols-[320px_1fr] items-start">
					<ExerciseModes topicId={topicId} hasFillBlank={hasFillBlank} />
					<WordList
						words={words}
						progressSummary={progressSummary}
						levelControls={
							<LevelFilters
								level={currentLevel}
								availableLevels={availableLevels}
								allowClear={false}
								onLevelChange={(nextLevel) => {
									if (!nextLevel || nextLevel === currentLevel) return
									const nextTopic = siblingTopics.find((item) => toLevel(item.level) === nextLevel)
									if (!nextTopic) return
									void navigate({ to: "/luyen-tap/tu-vung/$topicId", params: { topicId: nextTopic.id } })
								}}
							/>
						}
					/>
				</div>
			</div>
		</>
	)
}

interface TopicLevelSource {
	level: string
}

function availableTopicLevels(topics: TopicLevelSource[], fallbackLevel: ReturnType<typeof toLevel>) {
	const levels = topics.map((item) => toLevel(item.level)).filter((level) => level !== null)
	if (levels.length === 0 && fallbackLevel) return [fallbackLevel]
	return Array.from(new Set(levels))
}

type TopicProgressSource = Pick<VocabTopic, "level" | "word_count" | "learned_count">

function topicProgressSummary(
	currentTopic: TopicProgressSource,
	currentTotal: number,
	topics: TopicProgressSource[],
): string {
	const currentLevel = currentTopic.level
	const current = topics.find((item) => item.level === currentLevel)
	const currentLearned = current?.learned_count ?? currentTopic.learned_count ?? 0
	const currentWords = current?.word_count ?? currentTopic.word_count ?? currentTotal
	const summaryTopics = topics.length > 0 ? topics : [currentTopic]
	const overallLearned = summaryTopics.reduce((sum, item) => sum + (item.learned_count ?? 0), 0)
	const overallWords = summaryTopics.reduce((sum, item) => sum + (item.word_count ?? 0), 0)

	if (overallWords <= 0) return `${currentLevel}: ${currentLearned}/${currentWords} từ`
	return `${currentLevel}: ${currentLearned}/${currentWords} từ · Tổng chủ đề: ${overallLearned}/${overallWords} từ`
}
