import type { ExamVersionMcqItem, McqDetailItem } from "#/features/exam/types"

const LETTER = ["A", "B", "C", "D"] as const

interface Props {
	items: ExamVersionMcqItem[]
	detailMap: Map<string, McqDetailItem>
}

export function McqGrid({ items, detailMap }: Props) {
	const sorted = [...items].sort((a, b) => a.display_order - b.display_order)

	return (
		<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
			{sorted.map((item, idx) => {
				const detail = detailMap.get(item.id)
				const correct = detail?.is_correct ?? false
				const answered = detail?.selected_index !== null && detail?.selected_index !== undefined
				const userLetter = detail && answered ? LETTER[detail.selected_index as 0 | 1 | 2 | 3] : "—"
				const answerLetter = detail ? LETTER[detail.correct_index as 0 | 1 | 2 | 3] : "?"

				return (
					<div
						key={item.id}
						className="flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-2 text-xs"
						style={{
							borderColor: correct
								? "var(--color-primary-tint)"
								: answered
									? "var(--color-destructive-tint)"
									: "var(--color-border)",
							backgroundColor: correct
								? "var(--color-primary-tint)"
								: answered
									? "var(--color-destructive-tint)"
									: "var(--color-background)",
						}}
					>
						<span className="font-bold text-foreground tabular-nums w-5">{idx + 1}</span>
						<span
							className="font-extrabold tabular-nums"
							style={{
								color: correct
									? "var(--color-primary)"
									: answered
										? "var(--color-destructive)"
										: "var(--color-placeholder)",
							}}
						>
							{userLetter}
						</span>
						{!correct && (
							<span className="text-[10px] text-subtle">
								→ <span className="text-primary">{answerLetter}</span>
							</span>
						)}
					</div>
				)
			})}
		</div>
	)
}
