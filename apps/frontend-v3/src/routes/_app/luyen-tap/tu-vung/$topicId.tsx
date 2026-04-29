import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { ExerciseModes } from "#/features/vocab/components/ExerciseModes"
import { WordList } from "#/features/vocab/components/WordList"
import { vocabTopicDetailQuery } from "#/features/vocab/queries"

export const Route = createFileRoute("/_app/luyen-tap/tu-vung/$topicId")({
	component: TopicDetailPage,
})

function TopicDetailPage() {
	const { topicId } = Route.useParams()
	const { data, isLoading } = useQuery(vocabTopicDetailQuery(topicId))

	if (isLoading) return <Header title="Từ vựng" backTo="/luyen-tap/tu-vung" />
	if (!data?.data?.topic) return null

	const { topic, words, exercises } = data.data
	const hasFillBlank = exercises.some((e) => e.kind === "fill_blank")

	return (
		<>
			<Header title={topic.name} backTo="/luyen-tap/tu-vung" />
			<div className="px-10 pb-12">
				<div className="grid gap-6 lg:grid-cols-[320px_1fr] items-start">
					<ExerciseModes topicId={topicId} hasFillBlank={hasFillBlank} />
					<WordList words={words} />
				</div>
			</div>
		</>
	)
}
