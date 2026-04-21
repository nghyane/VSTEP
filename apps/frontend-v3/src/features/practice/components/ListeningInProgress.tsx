import { Link } from "@tanstack/react-router"
import { AudioBar } from "#/features/practice/components/AudioBar"
import { QuestionList } from "#/features/practice/components/QuestionList"
import { QuestionNav } from "#/features/practice/components/QuestionNav"
import type { ExerciseDetail } from "#/features/practice/types"
import { useListeningSession } from "#/features/practice/use-listening-session"

interface Props {
	detail: ExerciseDetail
	sessionId: string
}

export function ListeningInProgress({ detail, sessionId }: Props) {
	const { exercise, questions } = detail
	const session = useListeningSession(sessionId, questions)

	return (
		<div className="flex flex-col h-screen bg-background">
			{/* Header */}
			<div className="flex items-center justify-between border-b-2 border-border bg-surface px-6 py-4">
				<div>
					<h2 className="font-extrabold text-lg text-foreground">{exercise.title}</h2>
					<p className="text-sm text-subtle mt-0.5">Part {exercise.part} · {questions.length} câu</p>
				</div>
				<span className="text-sm font-bold text-muted">{session.answeredCount}/{questions.length}</span>
			</div>

			{/* Questions */}
			<div className="flex-1 overflow-y-auto">
				<div className="max-w-3xl mx-auto px-6 py-8">
					<QuestionList questions={questions} answers={session.answers} result={session.result} onSelect={session.select} />

					{session.result && (
						<div className="card p-6 text-center mt-8">
							<p className="font-extrabold text-2xl text-foreground">
								{session.result.score}/{session.result.total}
							</p>
							<p className="text-sm text-muted mt-1">câu đúng</p>
							<Link to="/luyen-tap/nghe" className="btn btn-primary px-8 py-3 text-base mt-5">
								Quay lại
							</Link>
						</div>
					)}
				</div>
			</div>

			{/* Sticky bottom */}
			<div className="shrink-0">
				<AudioBar src={exercise.audio_url} />
				<QuestionNav questions={questions} answers={session.answers} result={session.result} />
				{!session.result && (
					<div className="bg-surface px-6 py-3">
						<button
							type="button"
							onClick={session.submit}
							disabled={session.submitting || session.answeredCount < questions.length}
							className="btn btn-primary w-full py-3.5 text-base disabled:opacity-50"
						>
							{session.submitting ? "Đang chấm..." : `NỘP BÀI (${session.answeredCount}/${questions.length})`}
						</button>
					</div>
				)}
			</div>
		</div>
	)
}
