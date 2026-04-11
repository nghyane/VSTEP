// PassagePanel — bài đọc bên trái session (desktop) hoặc trên (mobile).

import type { ReadingExercise } from "#/lib/mock/reading"

interface Props {
	exercise: ReadingExercise
}

export function PassagePanel({ exercise }: Props) {
	const paragraphs = exercise.passage.split(/\n\n+/).filter((p) => p.trim().length > 0)
	return (
		<div className="rounded-2xl border bg-card p-6 shadow-sm">
			<h2 className="mb-4 text-lg font-bold">{exercise.title}</h2>
			<div className="space-y-3 text-sm leading-relaxed text-foreground/90">
				{paragraphs.map((para, index) => (
					<p key={`passage-${index}`} className="whitespace-pre-wrap">
						{para}
					</p>
				))}
			</div>
		</div>
	)
}
