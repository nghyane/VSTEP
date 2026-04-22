import type { VocabExercise } from "#/features/vocab/types"

const KIND_LABELS = { mcq: "Trắc nghiệm", fill_blank: "Điền từ", word_form: "Word form" } as const

export function ExerciseQuestion({ exercise }: { exercise: VocabExercise }) {
	return (
		<div className="card p-6">
			<div className="flex items-center justify-between mb-3">
				<p className="text-xs font-bold text-muted uppercase tracking-wide">
					{exercise.kind === "fill_blank"
						? "Điền vào chỗ trống"
						: exercise.kind === "word_form"
							? exercise.payload.instruction
							: "Chọn đáp án đúng"}
				</p>
				<span className="text-xs font-bold text-subtle bg-background px-2.5 py-1 rounded-full">
					{KIND_LABELS[exercise.kind]}
				</span>
			</div>

			{exercise.kind === "mcq" && (
				<p className="font-bold text-lg text-foreground">{exercise.payload.prompt}</p>
			)}

			{exercise.kind === "fill_blank" && (
				<p className="text-xl font-bold text-foreground leading-loose">{exercise.payload.sentence}</p>
			)}

			{exercise.kind === "word_form" && (
				<>
					<div className="bg-background rounded-xl px-4 py-3">
						<p className="text-lg text-foreground leading-relaxed">{exercise.payload.sentence}</p>
					</div>
					<p className="text-sm text-subtle mt-3">
						Từ gốc: <strong className="text-foreground">{exercise.payload.root_word}</strong>
					</p>
				</>
			)}
		</div>
	)
}
