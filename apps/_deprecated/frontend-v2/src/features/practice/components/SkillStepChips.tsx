// SkillStepChips — circle step chips cho session footer (thay McqNavBar).
// Mỗi chip = 1 câu, hiển thị số + trạng thái (answered, correct/wrong khi submitted).

import { Check, X } from "lucide-react"
import { cn } from "#/shared/lib/utils"

interface Props {
	total: number
	answered: readonly boolean[]
	submitted: boolean
	isCorrect?: readonly (boolean | null)[]
	accentClass?: string
}

export function SkillStepChips({
	total,
	answered,
	submitted,
	isCorrect,
	accentClass = "bg-primary",
}: Props) {
	return (
		<div className="flex flex-wrap items-center gap-1.5">
			{Array.from({ length: total }, (_, i) => {
				const done = answered[i]
				const correct = isCorrect?.[i]
				let chipClass = "border-border bg-background text-muted-foreground"
				if (submitted && correct === true) chipClass = "border-success bg-success text-white"
				else if (submitted && correct === false)
					chipClass = "border-destructive bg-destructive text-white"
				else if (done) chipClass = cn("border-transparent text-white", accentClass)

				return (
					<span
						key={i}
						className={cn(
							"flex size-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
							chipClass,
						)}
					>
						{submitted && correct === true ? (
							<Check className="size-3.5" strokeWidth={3} />
						) : submitted && correct === false ? (
							<X className="size-3.5" strokeWidth={3} />
						) : (
							i + 1
						)}
					</span>
				)
			})}
		</div>
	)
}
