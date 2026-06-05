import { useSuspenseQuery } from "@tanstack/react-query"
import { ExamResultScreen } from "#/features/exam/components/ExamResultScreen"
import { sessionResultsQuery } from "#/features/exam/queries"

export function SubmittedExamRoom({ sessionId }: { sessionId: string }) {
	const { data: resultsRes } = useSuspenseQuery(sessionResultsQuery(sessionId))
	const result = resultsRes.data

	return <ExamResultScreen result={result} />
}
