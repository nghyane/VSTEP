import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"
import { Loading } from "#/components/Loading"
import { ExamResultScreen } from "#/features/exam/components/ExamResultScreen"
import { sessionResultsQuery } from "#/features/exam/queries"

export const Route = createFileRoute("/_focused/phong-thi/$sessionId_/chi-tiet")({
	component: ChiTietPage,
})

function ChiTietPage() {
	return (
		<Suspense fallback={<Loading />}>
			<ChiTietInner />
		</Suspense>
	)
}

function ChiTietInner() {
	const { sessionId } = Route.useParams()
	const { data: resultsRes } = useSuspenseQuery(sessionResultsQuery(sessionId))
	const result = resultsRes.data

	return <ExamResultScreen result={result} />
}
