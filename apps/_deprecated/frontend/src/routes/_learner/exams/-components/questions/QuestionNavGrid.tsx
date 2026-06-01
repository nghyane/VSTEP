import { memo } from "react"
import { cn } from "@/lib/utils"
import type { SessionQuestion } from "@/types/api"

interface QuestionNavGridProps {
	questions: SessionQuestion[]
	answeredIds: Set<string>
	onJump: (questionId: string) => void
}

export const QuestionNavGrid = memo(function QuestionNavGrid({
	questions,
	answeredIds,
	onJump,
}: QuestionNavGridProps) {
	return (
		<div>
			<div className="flex flex-wrap gap-1.5">
				{questions.map((q, i) => {
					const answered = answeredIds.has(q.id)
					return (
						<button
							key={q.id}
							type="button"
							onClick={() => onJump(q.id)}
							className={cn(
								"size-8 rounded-md text-xs font-medium transition-colors",
								answered
									? "bg-primary text-primary-foreground"
									: "bg-background border border-border text-muted-foreground hover:border-primary/50",
							)}
						>
							{i + 1}
						</button>
					)
				})}
			</div>
			<div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
				<span className="flex items-center gap-1.5">
					<span className="inline-block size-2.5 rounded-full bg-primary" />
					Đã trả lời
				</span>
				<span className="flex items-center gap-1.5">
					<span className="inline-block size-2.5 rounded-full border border-border bg-background" />
					Chưa trả lời
				</span>
			</div>
		</div>
	)
})
