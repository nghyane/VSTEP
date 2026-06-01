import { Cancel01Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { memo } from "react"
import { cn } from "@/lib/utils"

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

interface MCQItemReviewProps {
	index: number
	stem: string
	options: string[]
	selectedOption: string | null
	correctOption: string | null
}

export const MCQItemReview = memo(function MCQItemReview({
	index,
	stem,
	options,
	selectedOption,
	correctOption,
}: MCQItemReviewProps) {
	const isCorrect = selectedOption !== null && selectedOption === correctOption

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<p className="font-medium">{stem}</p>
				{selectedOption !== null && correctOption !== null && (
					<HugeiconsIcon
						icon={isCorrect ? CheckmarkCircle01Icon : Cancel01Icon}
						className={cn("size-5 shrink-0", isCorrect ? "text-emerald-600" : "text-destructive")}
					/>
				)}
			</div>

			<div className="space-y-2">
				{options.map((option, optionIndex) => {
					const letter = LETTERS[optionIndex] ?? String(optionIndex)
					const isSelected = selectedOption === letter
					const isCorrectAnswer = correctOption === letter
					const isWrong = isSelected && !isCorrectAnswer

					return (
						<div
							key={`${index}-${letter}`}
							className={cn(
								"flex items-center gap-3 rounded-lg border px-4 py-3",
								isCorrectAnswer && "border-emerald-500 bg-emerald-500/10",
								isWrong && "border-destructive bg-destructive/10",
								!isCorrectAnswer && !isWrong && "border-border",
							)}
						>
							<span
								className={cn(
									"flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
									isCorrectAnswer && "bg-emerald-500 text-white",
									isWrong && "bg-destructive text-destructive-foreground",
									!isCorrectAnswer && !isWrong && "bg-muted text-muted-foreground",
								)}
							>
								{letter}
							</span>
							<span className="text-sm">{option}</span>
							{isCorrectAnswer && (
								<HugeiconsIcon
									icon={CheckmarkCircle01Icon}
									className="ml-auto size-4 shrink-0 text-emerald-600"
								/>
							)}
							{isWrong && (
								<HugeiconsIcon
									icon={Cancel01Icon}
									className="ml-auto size-4 shrink-0 text-destructive"
								/>
							)}
						</div>
					)
				})}
			</div>
		</div>
	)
})
