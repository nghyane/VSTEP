import { memo } from "react"
import { cn } from "@/lib/utils"

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

interface MCQItemRendererProps {
	index: number
	stem: string
	options: string[]
	selectedOption: string | null
	onSelect: (itemIndex: number, optionIndex: number) => void
}

export const MCQItemRenderer = memo(function MCQItemRenderer({
	index,
	stem,
	options,
	selectedOption,
	onSelect,
}: MCQItemRendererProps) {
	return (
		<div className="space-y-3">
			<p className="font-medium">{stem}</p>

			<div className="space-y-2">
				{options.map((option, optionIndex) => {
					const letter = LETTERS[optionIndex] ?? String(optionIndex)
					const isSelected = selectedOption === letter

					return (
						<div
							key={letter}
							role="button"
							tabIndex={0}
							onClick={() => onSelect(index, optionIndex)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault()
									onSelect(index, optionIndex)
								}
							}}
							className={cn(
								"flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
								isSelected
									? "border-primary bg-primary/5"
									: "border-border hover:border-primary/50",
							)}
						>
							<span
								className={cn(
									"flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
									isSelected
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground",
								)}
							>
								{letter}
							</span>
							<span className="text-sm">{option}</span>
						</div>
					)
				})}
			</div>
		</div>
	)
})
