import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
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

	return (
		<>
			<Header title={detail.point.name} />
			<div className="px-10 pb-12 space-y-8">
				<PointHeader detail={detail} />
				<Structures structures={detail.structures} />
				<Examples examples={detail.examples} />
				<CommonMistakes mistakes={detail.common_mistakes} />
				<VstepTips tips={detail.vstep_tips} />
			</div>
		</>
	)
}
