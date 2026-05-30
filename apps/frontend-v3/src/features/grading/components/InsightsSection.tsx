import type { InsightsEntry } from "#/features/grading/types"

interface Props {
	insights: Record<string, InsightsEntry> | null | undefined
	scores: Record<string, number>
	color: string
}

export function InsightsSection({ insights, scores, color }: Props) {
	if (!insights || Object.keys(insights).length === 0) return null

	const entries = Object.entries(insights)

	return (
		<div className="card p-6 space-y-3">
			<p className="text-xs font-bold uppercase tracking-wide text-subtle mb-2">Phân tích chi tiết</p>
			{entries.map(([key, item]) => {
				const score = scores[key]
				return (
					<div key={key} className="flex items-start gap-3">
						<span
							className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold tabular-nums text-white"
							style={{ backgroundColor: color }}
						>
							{score != null ? score : "–"}
						</span>
						<div>
							<p className="text-sm font-bold text-foreground">{item.label}</p>
							<p className="text-sm text-subtle">{item.detail}</p>
						</div>
					</div>
				)
			})}
		</div>
	)
}
