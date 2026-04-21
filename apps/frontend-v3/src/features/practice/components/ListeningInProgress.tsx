import { Link } from "@tanstack/react-router"
import { AudioBar } from "#/features/practice/components/AudioBar"
import { QuestionList, QuestionNav } from "#/features/practice/components/QuestionList"
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
		<div className="flex flex-col min-h-screen bg-background">
			<div className="flex items-center justify-between border-b border-border px-6 py-3">
				<div>
					<p className="text-sm font-bold text-foreground">{exercise.title}</p>
					<p className="text-xs text-subtle">Part {exercise.part} · {questions.length} câu</p>
				</div>
				<p className="text-sm text-muted">{session.answeredCount}/{questions.length}</p>
			</div>

			<div className="flex-1 overflow-y-auto">
				<div className="max-w-3xl mx-auto p-6">
					<QuestionList questions={questions} answers={session.answers} result={session.result} onSelect={session.select} />

					{session.result && (
						<div className="card p-5 text-center border-primary bg-primary-tint mt-6">
							<p className="font-extrabold text-lg text-foreground">
								{session.result.score}/{session.result.total} câu đúng
							</p>
							<Link to="/luyen-tap/nghe" className="btn btn-primary px-8 py-3 text-base mt-4">
								Quay lại
							</Link>
						</div>
					)}
				</div>
			</div>

			<AudioBar src={exercise.audio_url} />
			<QuestionNav questions={questions} answers={session.answers} result={session.result} />

			{!session.result && (
				<div className="border-t border-border px-6 py-3">
					<button
						type="button"
						onClick={session.submit}
						disabled={session.submitting || session.answeredCount < questions.length}
						className="btn btn-primary w-full py-3.5 text-base disabled:opacity-50"
					>
						{session.submitting ? "Đang chấm..." : `Nộp bài (${session.answeredCount}/${questions.length})`}
					</button>
				</div>
			)}
		</div>
	)
}
