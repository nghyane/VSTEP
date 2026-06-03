import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { startReadingSession, submitReadingSession } from "#/features/practice/actions"
import { ReadingInProgress } from "#/features/practice/components/ReadingInProgress"
import { readingExerciseDetailQuery } from "#/features/practice/queries"
import { useMcqPracticeSession } from "#/features/practice/use-mcq-session"
import { FocusBar } from "#/features/vocab/components/FocusBar"

export const Route = createFileRoute("/_focused/reading/$exerciseId")({
	component: ReadingExercisePage,
})

function ReadingExercisePage() {
	const { exerciseId } = Route.useParams()
	const { data } = useQuery(readingExerciseDetailQuery(exerciseId))
	const [sessionId, setSessionId] = useState<string | null>(null)

	const startMutation = useMutation({
		mutationFn: () => startReadingSession(exerciseId),
		onSuccess: (res) => setSessionId(res.data.id),
	})
	const shouldStart = !!data && !sessionId && startMutation.status === "idle"

	const session = useMcqPracticeSession(sessionId, submitReadingSession, "reading")

	useEffect(() => {
		if (shouldStart) startMutation.mutate()
	}, [shouldStart, startMutation.mutate])

	if (!data || !sessionId) {
		return (
			<div className="min-h-screen bg-background flex flex-col">
				<FocusBar backTo="/luyen-tap/doc" current={0} total={data?.data.questions.length ?? 0} />
				<div className="flex-1 flex items-center justify-center">
					<p className="text-muted">{data ? "Đang bắt đầu..." : "Đang tải..."}</p>
				</div>
			</div>
		)
	}

	return <ReadingInProgress detail={data.data} session={session} />
}
