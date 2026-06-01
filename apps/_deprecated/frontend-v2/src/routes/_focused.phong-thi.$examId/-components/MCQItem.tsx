// MCQItem — single MCQ question item for listening exam.

import { motion } from "motion/react"
import { cn } from "#/shared/lib/utils"

const LETTERS = "ABCD"

export function MCQItem({
	index,
	stem,
	options,
	selected,
	onSelect,
}: {
	index: number
	stem: string
	options: string[]
	selected: string | null
	onSelect: (letter: string) => void
}) {
	return (
		<div className="space-y-2">
			<p className="text-sm font-medium">
				Câu {index + 1}. {stem}
			</p>
			<div className="grid gap-2 sm:grid-cols-2">
				{options.map((opt, oi) => {
					const letter = LETTERS[oi] ?? String(oi + 1)
					const isSelected = selected === letter
					return (
						<motion.button
							key={`${index}-${oi}`}
							type="button"
							onClick={() => onSelect(letter)}
							whileTap={{ scale: 0.97 }}
							transition={{ type: "spring", stiffness: 450, damping: 25 }}
							className={cn(
								"flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
								isSelected
									? "border-primary border-b-2 border-b-primary/60 bg-primary/5 shadow-sm"
									: "border-border hover:border-primary/40 hover:bg-muted/30",
							)}
						>
							<span
								className={cn(
									"flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
									isSelected
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground",
								)}
							>
								{letter}
							</span>
							<span>{opt}</span>
						</motion.button>
					)
				})}
			</div>
		</div>
	)
}
