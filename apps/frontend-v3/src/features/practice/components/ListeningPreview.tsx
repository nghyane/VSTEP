import type { ExerciseDetail } from "#/features/practice/types"
import { FocusBar } from "#/features/vocab/components/FocusBar"

interface Props {
	detail: ExerciseDetail
	starting: boolean
	onStart: () => void
}

export function ListeningPreview({ detail, starting, onStart }: Props) {
	const { exercise, questions } = detail

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<FocusBar backTo="/luyen-tap/nghe" current={0} total={questions.length} />
			<div className="flex-1 flex items-center justify-center px-6">
				<div className="text-center">
					<p className="text-xs font-bold text-info bg-info-tint px-2.5 py-1 rounded-full inline-block mb-3">
						Part {exercise.part}
					</p>
					<h2 className="font-extrabold text-xl text-foreground">{exercise.title}</h2>
					{exercise.description && <p className="text-sm text-muted mt-2 max-w-md">{exercise.description}</p>}
					<p className="text-sm text-subtle mt-3">{questions.length} câu hỏi</p>
					<button
						type="button"
						onClick={onStart}
						disabled={starting}
						className="btn px-10 py-3.5 text-base mt-6 text-primary-foreground disabled:opacity-50"
						style={
							{
								background: "var(--color-skill-listening)",
								"--btn-shadow": "var(--color-skill-listening-dark)",
							} as React.CSSProperties
						}
					>
						{starting ? "Đang bắt đầu..." : "Bắt đầu làm bài"}
					</button>
				</div>
			</div>
		</div>
	)
}
