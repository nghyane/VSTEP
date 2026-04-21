import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { Header } from "#/components/Header"
import { startListeningSession } from "#/features/practice/actions"
import { AudioPlayer } from "#/features/practice/components/AudioPlayer"
import { QuestionList } from "#/features/practice/components/QuestionList"
import { listeningExerciseDetailQuery } from "#/features/practice/queries"
import { useListeningSession } from "#/features/practice/use-listening-session"

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

	const { exercise, questions } = data.data
	const session = useListeningSession(sessionId, questions)

	if (!sessionId) {
		return (
			<>
				<Header title={exercise.title} />
				<div className="px-10 pb-12 space-y-6">
					<AudioPlayer exercise={exercise} />
					<div className="text-center">
						<p className="text-sm text-muted mb-4">{questions.length} câu hỏi · Part {exercise.part}</p>
						<button
							type="button"
							onClick={() => startMutation.mutate()}
							disabled={startMutation.isPending}
							className="btn btn-primary px-10 py-3.5 text-base disabled:opacity-50"
						>
							{startMutation.isPending ? "Đang bắt đầu..." : "Bắt đầu làm bài"}
						</button>
					</div>
				</div>
			</>
		)
	}

	return (
		<>
			<Header title={exercise.title} />
			<div className="px-10 pb-12 space-y-6">
				<AudioPlayer exercise={exercise} />
				<QuestionList questions={questions} answers={session.answers} result={session.result} onSelect={session.select} />

				{session.result ? (
					<div className="card p-6 text-center">
						<h3 className="font-extrabold text-xl text-foreground mb-2">
							{session.result.score}/{session.result.total} câu đúng
						</h3>
						<Link to="/luyen-tap/nghe" className="btn btn-primary px-8 py-3 text-base mt-4">
							Quay lại
						</Link>
					</div>
				) : (
					<button
						type="button"
						onClick={session.submit}
						disabled={session.submitting || session.answeredCount < questions.length}
						className="btn btn-primary w-full py-3.5 text-base disabled:opacity-50"
					>
						{session.submitting ? "Đang chấm..." : `Nộp bài (${session.answeredCount}/${questions.length})`}
					</button>
				)}
			</div>
		</>
	)
}
