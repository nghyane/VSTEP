import { Header } from "#/components/Header"
import type { ExerciseDetail } from "#/features/practice/types"

interface Props {
	detail: ExerciseDetail
	starting: boolean
	onStart: () => void
}

export function ListeningPreview({ detail, starting, onStart }: Props) {
	const { exercise, questions } = detail

	return (
		<>
			<Header title={exercise.title} />
			<div className="px-10 pb-12">
				<section className="card p-6 text-center">
					<p className="text-xs font-bold text-info bg-info-tint px-2.5 py-1 rounded-full inline-block mb-3">Part {exercise.part}</p>
					<h2 className="font-extrabold text-xl text-foreground">{exercise.title}</h2>
					{exercise.description && <p className="text-sm text-muted mt-2">{exercise.description}</p>}
					<p className="text-sm text-subtle mt-3">
						{questions.length} câu hỏi
						{exercise.estimated_minutes ? ` · ~${exercise.estimated_minutes} phút` : ""}
					</p>
					<button
						type="button"
						onClick={onStart}
						disabled={starting}
						className="btn btn-primary px-10 py-3.5 text-base mt-6 disabled:opacity-50"
					>
						{starting ? "Đang bắt đầu..." : "Bắt đầu làm bài"}
					</button>
				</section>
			</div>
		</>
	)
}
