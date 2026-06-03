import { useSuspenseQuery } from "@tanstack/react-query"
import { ExamResultScreen } from "#/features/exam/components/ExamResultScreen"
import { sessionResultsQuery } from "#/features/exam/queries"

export function SubmittedExamRoom({ sessionId, examId }: { sessionId: string; examId: string }) {
	const { data: resultsRes } = useSuspenseQuery(sessionResultsQuery(sessionId))
	const result = resultsRes.data

	return (
		<ExamResultScreen
			result={result}
			examTitle={result.exam?.title ?? "bài kiểm tra"}
			examId={result.exam?.id ?? examId}
			sessionId={sessionId}
		/>
	)
}
