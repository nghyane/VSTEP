import { cn } from "@/lib/utils"
import type { MCQContent } from "@/components/features/assignments/types"

interface MCQAnswerFormProps {
	content: MCQContent
	answers: number[]
	onChange: (answers: number[]) => void
	disabled?: boolean
}

export function MCQAnswerForm({ content, answers, onChange, disabled }: MCQAnswerFormProps) {
	function selectOption(qIndex: number, oIndex: number) {
		if (disabled) return
		const updated = [...answers]
		updated[qIndex] = oIndex
		onChange(updated)
	}

	return (
		<div className="space-y-6">
			{/* Audio for listening */}
			{content.audioUrl && (
				<div className="rounded-lg bg-muted/50 p-4">
					<p className="mb-2 text-xs font-medium text-muted-foreground">Nghe audio:</p>
					<audio controls className="w-full" src={content.audioUrl}>
						<track kind="captions" />
					</audio>
				</div>
			)}

			{/* Passage for reading */}
			{content.passage && (
				<div className="rounded-lg bg-muted/50 p-4">
					<p className="mb-2 text-xs font-medium text-muted-foreground">Đọc đoạn văn:</p>
					<p className="whitespace-pre-wrap text-sm leading-relaxed">{content.passage}</p>
				</div>
			)}

			{/* Questions */}
			{content.questions.map((q, qi) => (
				<div key={`q-${qi.toString()}`} className="space-y-2">
					<p className="text-sm font-medium">
						Câu {qi + 1}: {q.question}
					</p>
					<div className="grid gap-2 sm:grid-cols-2">
						{q.options.map((opt, oi) => (
							<button
								key={`q${qi.toString()}-o${oi.toString()}`}
								type="button"
								disabled={disabled}
								onClick={() => selectOption(qi, oi)}
								className={cn(
									"rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
									answers[qi] === oi
										? "border-primary bg-primary/10 font-medium text-primary"
										: "hover:bg-muted/50",
									disabled && "cursor-default opacity-70",
								)}
							>
								<span className="mr-2 font-semibold">{String.fromCharCode(65 + oi)}.</span>
								{opt}
							</button>
						))}
					</div>
				</div>
			))}
		</div>
	)
}
