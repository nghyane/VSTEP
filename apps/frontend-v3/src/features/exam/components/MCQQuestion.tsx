import type { ExamVersionMcqItem } from "#/features/exam/types"
import { cn } from "#/lib/utils"

const OPTION_LABELS = ["A", "B", "C", "D"] as const

interface Props {
	item: ExamVersionMcqItem
	index: number
	selectedIndex: number | undefined
	onSelect: (itemId: string, selectedIndex: number) => void
}

export function MCQQuestion({ item, index, selectedIndex, onSelect }: Props) {
	return (
		<div className="space-y-3">
			<p className="text-sm font-semibold leading-relaxed text-foreground">
				<span className="mr-2 font-bold text-muted">{index + 1}.</span>
				{item.stem}
			</p>

			<div className="space-y-2">
				{item.options.map((opt, optIdx) => {
					const isSelected = selectedIndex === optIdx
					const label = OPTION_LABELS[optIdx]
					return (
						<button
							key={optIdx}
							type="button"
							onClick={() => onSelect(item.id, optIdx)}
							aria-pressed={isSelected}
							className={cn(
								"flex w-full items-center gap-3 rounded-(--radius-card) border-2 border-b-4 px-4 py-3 text-left text-sm font-semibold transition-all active:translate-y-[2px] active:border-b-2",
								isSelected
									? "border-skill-listening bg-skill-listening/10 text-foreground"
									: "border-border bg-surface text-foreground hover:border-skill-listening/40 hover:bg-skill-listening/5",
							)}
						>
							<span
								className={cn(
									"flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold transition-colors",
									isSelected
										? "border-skill-listening bg-skill-listening text-white"
										: "border-border bg-background text-muted",
								)}
							>
								{label}
							</span>
							<span className="flex-1 leading-relaxed">{opt}</span>
						</button>
					)
				})}
			</div>
		</div>
	)
}
