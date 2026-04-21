import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { ExerciseModes } from "#/features/vocab/components/ExerciseModes"
import { TopicHero } from "#/features/vocab/components/TopicHero"
import { WordList } from "#/features/vocab/components/WordList"
import { vocabTopicDetailQuery } from "#/features/vocab/queries"

export const Route = createFileRoute("/_app/luyen-tap/tu-vung/$topicId")({
	component: TopicDetailPage,
})

function TopicDetailPage() {
	const { topicId } = Route.useParams()
	const { data, isLoading } = useQuery(vocabTopicDetailQuery(topicId))

	if (isLoading) return <Header title="Từ vựng" />
	if (!data?.data?.topic) return null

	const { topic, words } = data.data

	return (
		<>
			<Header title={topic.name} />
			<div className="px-10 pb-12 space-y-6">
				<TopicHero topic={topic} words={words} topicId={topicId} />
				<ExerciseModes topicId={topicId} />
				<WordList words={words} />
			</div>
		</>
	)
}
