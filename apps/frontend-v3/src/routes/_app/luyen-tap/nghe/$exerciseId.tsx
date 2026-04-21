import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Header } from "#/components/Header"
import { startListeningSession } from "#/features/practice/actions"
import { ListeningInProgress } from "#/features/practice/components/ListeningInProgress"
import { ListeningPreview } from "#/features/practice/components/ListeningPreview"
import { listeningExerciseDetailQuery } from "#/features/practice/queries"

export const Route = createFileRoute("/_app/luyen-tap/nghe/$exerciseId")({
	component: ListeningDetailPage,
})

function ListeningDetailPage() {
	const { exerciseId } = Route.useParams()
	const { data } = useQuery(listeningExerciseDetailQuery(exerciseId))
	const [sessionId, setSessionId] = useState<string | null>(null)

	const startMutation = useMutation({
		mutationFn: () => startListeningSession(exerciseId),
		onSuccess: (res) => setSessionId(res.data.id),
	})

	if (!data) return <Header title="Nghe" />

	if (!sessionId) {
		return <ListeningPreview detail={data.data} starting={startMutation.isPending} onStart={() => startMutation.mutate()} />
	}

	return <ListeningInProgress detail={data.data} sessionId={sessionId} />
}
