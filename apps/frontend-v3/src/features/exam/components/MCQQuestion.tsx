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
				<span className="mr-2 text-muted">{index + 1}.</span>
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
							className={cn(
								"flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-all",
								isSelected
									? "border-primary bg-primary/8 text-foreground"
									: "border-border bg-surface hover:border-primary/50 hover:bg-primary/4 text-foreground",
							)}
							aria-pressed={isSelected}
						>
							<span
								className={cn(
									"flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
									isSelected ? "bg-primary text-white" : "bg-border text-muted",
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
