import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { startListeningSession } from "#/features/practice/actions"
import { ListeningInProgress } from "#/features/practice/components/ListeningInProgress"
import { ListeningPreview } from "#/features/practice/components/ListeningPreview"
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

	if (!data) {
		return (
			<div className="min-h-screen bg-background flex flex-col">
				<FocusBar backTo="/luyen-tap/nghe" current={0} total={0} />
				<div className="flex-1 flex items-center justify-center">
					<p className="text-muted">Đang tải...</p>
				</div>
			</div>
		)
	}

	if (!sessionId) {
		return (
			<ListeningPreview
				detail={data.data}
				starting={startMutation.isPending}
				onStart={() => startMutation.mutate()}
			/>
		)
	}

	return <ListeningInProgress detail={data.data} sessionId={sessionId} />
}
