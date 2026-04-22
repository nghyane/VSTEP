import { useState } from "react"
import { MCQQuestion } from "#/features/exam/components/MCQQuestion"
import type { ExamVersionReadingPassage } from "#/features/exam/types"
import { cn } from "#/lib/utils"

interface Props {
	passages: ExamVersionReadingPassage[]
	mcqAnswers: Map<string, number>
	onAnswer: (itemId: string, selectedIndex: number) => void
}

interface PassagePanelProps {
	passage: ExamVersionReadingPassage
	mcqAnswers: Map<string, number>
	onAnswer: (itemId: string, selectedIndex: number) => void
}

function PassagePanel({ passage, mcqAnswers, onAnswer }: PassagePanelProps) {
	return (
		<div className="grid h-full grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border">
			{/* Passage text */}
			<div className="overflow-y-auto px-6 py-6">
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<span className="rounded-full bg-skill-reading/15 px-3 py-1 text-xs font-bold text-skill-reading">
							Phần {passage.part}
						</span>
						<span className="text-xs text-muted">{passage.duration_minutes} phút</span>
					</div>
					<h2 className="text-base font-bold text-foreground">{passage.title}</h2>
					<div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap">
						{passage.passage}
					</div>
				</div>
			</div>

			{/* Questions */}
			<div className="overflow-y-auto px-6 py-6">
				<div className="space-y-6">
					{passage.items.map((item, idx) => (
						<MCQQuestion
							key={item.id}
							item={item}
							index={idx}
							selectedIndex={mcqAnswers.get(item.id)}
							onSelect={onAnswer}
						/>
					))}
				</div>
			</div>
		</div>
	)
}

export function ReadingPanel({ passages, mcqAnswers, onAnswer }: Props) {
	const [activeIdx, setActiveIdx] = useState(0)
	const active = passages[activeIdx]

	return (
		<div className="flex h-full flex-col">
			{/* Passage tabs */}
			{passages.length > 1 && (
				<div className="flex shrink-0 gap-1 border-b border-border bg-card px-5 py-2">
					{passages.map((p, idx) => (
						<button
							key={p.id}
							type="button"
							onClick={() => setActiveIdx(idx)}
							className={cn(
								"rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors",
								activeIdx === idx
									? "bg-skill-reading/15 text-skill-reading"
									: "text-muted hover:text-foreground hover:bg-surface",
							)}
						>
							Đoạn {p.part}
						</button>
					))}
				</div>
			)}

			{/* Content */}
			<div className="flex-1 overflow-hidden">
				{active && (
					<PassagePanel key={active.id} passage={active} mcqAnswers={mcqAnswers} onAnswer={onAnswer} />
				)}
			</div>
		</div>
	)
}
