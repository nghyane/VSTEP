import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { startListeningSession } from "#/features/practice/actions"
import { ListeningInProgress } from "#/features/practice/components/ListeningInProgress"
import { FocusBar } from "#/features/vocab/components/FocusBar"
import { listeningExerciseDetailQuery } from "#/features/practice/queries"

export const Route = createFileRoute("/_focused/listening/$exerciseId")({
	component: ListeningExercisePage,
})

function ListeningExercisePage() {
	const { exerciseId } = Route.useParams()
	const { data } = useQuery(listeningExerciseDetailQuery(exerciseId))
	const [sessionId, setSessionId] = useState<string | null>(null)
	const back = { backTo: "/luyen-tap/nghe" }

	const startMutation = useMutation({
		mutationFn: () => startListeningSession(exerciseId),
		onSuccess: (res) => setSessionId(res.data.id),
	})

	if (!data) {
		return (
			<div className="min-h-screen bg-background flex flex-col">
				<FocusBar {...back} current={0} total={0} />
				<div className="flex-1 flex items-center justify-center">
					<p className="text-muted">Đang tải...</p>
				</div>
			</div>
		)
	}

	const { exercise, questions } = data.data

	if (!sessionId) {
		return (
			<div className="min-h-screen bg-background flex flex-col">
				<FocusBar {...back} current={0} total={questions.length} />
				<div className="flex-1 flex items-center justify-center px-6">
					<div className="text-center">
						<p className="text-xs font-bold text-info bg-info-tint px-2.5 py-1 rounded-full inline-block mb-3">Part {exercise.part}</p>
						<h2 className="font-extrabold text-xl text-foreground">{exercise.title}</h2>
						{exercise.description && <p className="text-sm text-muted mt-2 max-w-md">{exercise.description}</p>}
						<p className="text-sm text-subtle mt-3">{questions.length} câu hỏi</p>
						<button
							type="button"
							onClick={() => startMutation.mutate()}
							disabled={startMutation.isPending}
							className="btn btn-primary px-10 py-3.5 text-base mt-6 disabled:opacity-50"
						>
							{startMutation.isPending ? "Đang bắt đầu..." : "Bắt đầu làm bài"}
						</button>
					</div>
				</div>
			</div>
		)
	}

	return <ListeningInProgress detail={data.data} sessionId={sessionId} />
}
