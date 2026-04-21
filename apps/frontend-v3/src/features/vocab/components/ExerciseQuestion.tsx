import type { ExerciseKind } from "#/features/vocab/use-exercise-session"

interface Props {
	kind: ExerciseKind
	payload: Record<string, unknown> | undefined
}

export function ExerciseQuestion({ kind, payload }: Props) {
	if (!payload) return null
	return (
		<div className="card p-6">
			{kind === "mcq" && <p className="font-bold text-lg text-foreground">{payload.prompt as string}</p>}
			{kind === "fill_blank" && <p className="font-bold text-lg text-foreground">{payload.sentence as string}</p>}
			{kind === "word_form" && (
				<>
					<p className="text-sm text-muted mb-2">{payload.instruction as string}</p>
					<p className="font-bold text-lg text-foreground">{payload.sentence as string}</p>
					<p className="text-sm text-subtle mt-2">Từ gốc: <strong className="text-foreground">{payload.root_word as string}</strong></p>
				</>
			)}
		</div>
	)
}
