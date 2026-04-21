import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { CommonMistakes, Examples, PointHeader, Structures, VstepTips } from "#/features/grammar/components/PointSections"
import { grammarPointDetailQuery } from "#/features/grammar/queries"

export const Route = createFileRoute("/_app/luyen-tap/ngu-phap/$pointId")({
	component: GrammarDetailPage,
})

function GrammarDetailPage() {
	const { pointId } = Route.useParams()
	const { data } = useQuery(grammarPointDetailQuery(pointId))

	if (!data) return <Header title="Ngữ pháp" />

	const detail = data.data
	const hasExercises = detail.exercises.length > 0

	return (
		<>
			<Header title={detail.point.name} />
			<div className="px-10 pb-12 space-y-8">
				<PointHeader detail={detail} />

				{hasExercises && (
					<section className="text-center">
						<Link
							to="/grammar/$pointId/exercise"
							params={{ pointId }}
							className="btn btn-primary px-10 py-3.5 text-base"
						>
							Luyện tập · {detail.exercises.length} câu
						</Link>
					</section>
				)}

				<Structures structures={detail.structures} />
				<Examples examples={detail.examples} />
				<CommonMistakes mistakes={detail.common_mistakes} />
				<VstepTips tips={detail.vstep_tips} />
			</div>
		</>
	)
}
