// McqNavBar — pills ở footer, click smooth-scroll tới câu tương ứng.
// Dùng chung cho Listening/Reading session. McqQuestionList gắn id `mcq-item-{idx}`.

import { cn } from "#/shared/lib/utils"

interface Props {
	total: number
	selectedAnswers: Record<number, number>
	submitted: boolean
	isCorrect: (itemIndex: number) => boolean | null
}

export function McqNavBar({ total, selectedAnswers, submitted, isCorrect }: Props) {
	return (
		<div className="flex flex-wrap items-center gap-1.5">
			{Array.from({ length: total }).map((_, index) => (
				<NavPill
					key={index}
					index={index}
					isAnswered={selectedAnswers[index] !== undefined}
					submitted={submitted}
					correctness={isCorrect(index)}
				/>
			))}
		</div>
	)
}

interface NavPillProps {
	index: number
	isAnswered: boolean
	submitted: boolean
	correctness: boolean | null
}

function NavPill({ index, isAnswered, submitted, correctness }: NavPillProps) {
	const baseClass = "border-border bg-background text-muted-foreground hover:bg-accent"
	const answeredClass = "border-primary bg-primary text-primary-foreground"
	const correctClass = "border-success bg-success/10 text-success"
	const wrongClass = "border-destructive bg-destructive/10 text-destructive"

	let pillClass = baseClass
	if (submitted) {
		if (correctness === true) pillClass = correctClass
		else if (correctness === false) pillClass = wrongClass
	} else if (isAnswered) {
		pillClass = answeredClass
	}

	const handleClick = () => {
		document
			.getElementById(`mcq-item-${index}`)
			?.scrollIntoView({ behavior: "smooth", block: "center" })
	}

	return (
		<button
			type="button"
			onClick={handleClick}
			className={cn(
				"flex size-8 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
				pillClass,
			)}
			aria-label={`Câu ${index + 1}`}
		>
			{index + 1}
		</button>
	)
}
