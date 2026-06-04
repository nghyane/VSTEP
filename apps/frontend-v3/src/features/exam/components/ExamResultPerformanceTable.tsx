import type { ExamResultPerformanceRow } from "#/features/exam/types"
import { cn } from "#/lib/utils"

export function ExamResultPerformanceTable({ rows }: { rows: ExamResultPerformanceRow[] }) {
	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="sticky top-0 z-10 border-b-2 border-border bg-background">
						<th className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-subtle">
							Loại câu hỏi
						</th>
						<th className="px-4 py-3 text-center text-xs font-extrabold uppercase tracking-wide text-subtle">
							Tổng
						</th>
						<th className="px-4 py-3 text-center text-xs font-extrabold uppercase tracking-wide text-subtle">
							Đúng
						</th>
						<th className="px-4 py-3 text-center text-xs font-extrabold uppercase tracking-wide text-subtle">
							Sai
						</th>
						<th className="px-4 py-3 text-center text-xs font-extrabold uppercase tracking-wide text-subtle">
							Kết quả
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row, idx) => (
						<tr
							key={`${row.skill}-${row.label}`}
							className={cn(
								"border-b border-border-light last:border-0",
								idx % 2 === 1 && "bg-background/40",
							)}
						>
							<td className="px-4 py-3 font-medium text-foreground">{row.label}</td>
							<td className="px-4 py-3 text-center tabular-nums text-muted">{row.total}</td>
							<td className="px-4 py-3 text-center tabular-nums">
								<AccuracyNumber value={row.correct} tone="success" />
							</td>
							<td className="px-4 py-3 text-center tabular-nums">
								<AccuracyNumber value={row.wrong} tone="danger" />
							</td>
							<td className="px-4 py-3 text-center">
								<PerformanceResultBadge row={row} />
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

function AccuracyNumber({ value, tone }: { value: number | null; tone: "success" | "danger" }) {
	if (value === null) return <span className="text-subtle">—</span>

	return (
		<span
			className={cn(
				"font-bold",
				value <= 0 ? "text-subtle" : tone === "success" ? "text-primary" : "text-destructive",
			)}
		>
			{value}
		</span>
	)
}

function PerformanceResultBadge({ row }: { row: ExamResultPerformanceRow }) {
	if (row.status === "pending") return <PendingBadge />
	if (row.status === "not_submitted") return <NotSubmittedBadge />
	if (row.score_type === "band" && row.band !== null) return <BandBadge band={row.band} />
	if (row.accuracy_pct !== null) return <AccuracyBadge pct={row.accuracy_pct} />

	return <span className="text-subtle">—</span>
}

function BandBadge({ band }: { band: number }) {
	const tone =
		band >= 7
			? "border-primary/30 bg-primary-tint text-primary"
			: band >= 5
				? "border-warning/30 bg-warning-tint text-warning"
				: "border-destructive/30 bg-destructive-tint text-destructive"
	return (
		<span
			className={cn(
				"inline-flex items-center justify-center rounded-full border-2 border-b-4 px-2.5 py-0.5 text-xs font-extrabold tabular-nums",
				tone,
			)}
		>
			Band {band.toFixed(1)}
		</span>
	)
}

function AccuracyBadge({ pct }: { pct: number }) {
	const tone =
		pct >= 70
			? "border-primary/30 bg-primary-tint text-primary"
			: pct >= 40
				? "border-warning/30 bg-warning-tint text-warning"
				: "border-destructive/30 bg-destructive-tint text-destructive"
	return (
		<span
			className={cn(
				"inline-flex items-center justify-center rounded-full border-2 border-b-4 px-2.5 py-0.5 text-xs font-extrabold tabular-nums",
				tone,
			)}
		>
			{pct}%
		</span>
	)
}

function PendingBadge() {
	return (
		<span className="inline-flex items-center gap-1.5 rounded-full border-2 border-b-4 border-warning/30 bg-warning-tint px-2.5 py-0.5 text-xs font-extrabold text-warning">
			<span className="relative flex size-1.5">
				<span className="absolute inline-flex size-full animate-ping rounded-full bg-warning opacity-60" />
				<span className="relative inline-flex size-1.5 rounded-full bg-warning" />
			</span>
			AI đang chấm
		</span>
	)
}

function NotSubmittedBadge() {
	return (
		<span className="inline-flex items-center justify-center rounded-full border-2 border-b-4 border-border bg-background px-2.5 py-0.5 text-xs font-extrabold text-subtle">
			Chưa nộp
		</span>
	)
}
