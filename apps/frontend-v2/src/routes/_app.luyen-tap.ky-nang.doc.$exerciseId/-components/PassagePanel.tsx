// PassagePanel — bài đọc bên trái session (desktop) hoặc trên (mobile).
// Có accordion "Bản dịch tiếng Việt" ở cuối.

import { ChevronDown, Languages } from "lucide-react"
import { useState } from "react"
import type { ReadingExercise } from "#/lib/mock/reading"
import { cn } from "#/lib/utils"

interface Props {
	exercise: ReadingExercise
	showTranslation?: boolean
}

export function PassagePanel({ exercise, showTranslation }: Props) {
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
			{showTranslation && <TranslationReveal translation={exercise.vietnameseTranslation} />}
		</div>
	)
}

function TranslationReveal({ translation }: { translation: string }) {
	const [open, setOpen] = useState(false)
	return (
		<div className="mt-4 border-t pt-3">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				className="flex w-full items-center gap-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
			>
				<Languages className="size-3.5" />
				<span className="flex-1">Xem bản dịch tiếng Việt</span>
				<ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
			</button>
			{open && (
				<p className="mt-2 rounded-lg bg-muted/50 p-3 text-sm leading-relaxed text-foreground/90">
					{translation}
				</p>
			)}
		</div>
	)
}
