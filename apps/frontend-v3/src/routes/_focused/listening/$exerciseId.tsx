import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { startListeningSession } from "#/features/practice/actions"
import { ListeningInProgress } from "#/features/practice/components/ListeningInProgress"
import { listeningExerciseDetailQuery } from "#/features/practice/queries"
import { FocusBar } from "#/features/vocab/components/FocusBar"

export const Route = createFileRoute("/_focused/listening/$exerciseId")({
	component: ListeningExercisePage,
})

function ListeningExercisePage() {
	const { exerciseId } = Route.useParams()
	const { data } = useQuery(listeningExerciseDetailQuery(exerciseId))
	const [sessionId, setSessionId] = useState<string | null>(null)

	const startMutation = useMutation({
		mutationFn: () => startListeningSession(exerciseId),
		onSuccess: (res) => setSessionId(res.data.id),
	})
	const shouldStart = !!data && !sessionId && startMutation.status === "idle"

	useEffect(() => {
		if (shouldStart) startMutation.mutate()
	}, [shouldStart, startMutation.mutate])

	if (!data || !sessionId) {
		return (
			<div className="min-h-screen bg-background flex flex-col">
				<FocusBar backTo="/luyen-tap/nghe" current={0} total={data?.data.questions.length ?? 0} />
				<div className="flex-1 flex items-center justify-center">
					<p className="text-muted">{data ? "Đang bắt đầu..." : "Đang tải..."}</p>
				</div>
			</div>
		)
	}

	return <ListeningInProgress detail={data.data} sessionId={sessionId} />
}
