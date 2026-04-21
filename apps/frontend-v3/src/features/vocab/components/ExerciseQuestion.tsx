import type { VocabExercise } from "#/features/vocab/types"

interface Props {
	exercise: VocabExercise
}

export function ExerciseQuestion({ exercise }: Props) {
	switch (exercise.kind) {
		case "mcq":
			return (
				<div className="card p-6">
					<p className="font-bold text-lg text-foreground">{exercise.payload.prompt}</p>
				</div>
			)
		case "fill_blank":
			return (
				<div className="card p-6">
					<p className="font-bold text-lg text-foreground">{exercise.payload.sentence}</p>
				</div>
			)
		case "word_form":
			return (
				<div className="card p-6">
					<p className="text-sm text-muted mb-2">{exercise.payload.instruction}</p>
					<p className="font-bold text-lg text-foreground">{exercise.payload.sentence}</p>
					<p className="text-sm text-subtle mt-2">
						Từ gốc: <strong className="text-foreground">{exercise.payload.root_word}</strong>
					</p>
				</div>
			)
	}
}
