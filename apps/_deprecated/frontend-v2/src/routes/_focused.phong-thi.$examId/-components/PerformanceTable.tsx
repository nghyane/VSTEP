import type { QuestionTypeResult } from "#/features/practice/lib/phong-thi-result"
import { cn } from "#/shared/lib/utils"

interface PerformanceTableProps {
	rows: readonly QuestionTypeResult[]
}

export function PerformanceTable({ rows }: PerformanceTableProps) {
	return (
		<div className="overflow-x-auto rounded-xl border-2 border-b-4 border-border border-b-slate-300 shadow-sm">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b-2 border-border bg-muted/60">
						<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Loại câu hỏi
						</th>
						<th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Tổng
						</th>
						<th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Đúng
						</th>
						<th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Sai
						</th>
						<th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Tỷ lệ
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row, idx) => (
						<tr
							key={row.label}
							className={cn(
								"border-b border-border/40 last:border-0 transition-colors hover:bg-muted/30",
								idx % 2 === 0 ? "bg-card" : "bg-muted/10",
							)}
						>
							<td className="px-4 py-3 font-medium text-foreground">{row.label}</td>
							<td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
								{row.total}
							</td>
							<td className="px-4 py-3 text-center tabular-nums">
								<span
									className={cn(
										"font-semibold",
										row.correct > 0 ? "text-success" : "text-muted-foreground",
									)}
								>
									{row.correct}
								</span>
							</td>
							<td className="px-4 py-3 text-center tabular-nums">
								<span className={cn(row.wrong > 0 ? "text-destructive" : "text-muted-foreground")}>
									{row.wrong}
								</span>
							</td>
							<td className="px-4 py-3 text-center">
								<AccuracyBadge pct={row.accuracyPct} />
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

// Gamification 3D badge — section 11.1 skill-design.md
function AccuracyBadge({ pct }: { pct: number }) {
	const classes =
		pct >= 70
			? "border-emerald-200 border-b-emerald-400 text-success bg-success/5"
			: pct >= 40
				? "border-amber-200 border-b-amber-400 text-warning bg-warning/5"
				: "border-rose-200 border-b-rose-400 text-destructive bg-destructive/5"

	return (
		<span
			className={cn(
				"inline-flex items-center justify-center rounded-lg border-2 border-b-[3px] px-2.5 py-0.5 text-xs font-bold",
				classes,
			)}
		>
			{pct}%
		</span>
	)
}
