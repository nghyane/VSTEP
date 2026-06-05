import { Icon } from "#/components/Icon"
import { bandLabel, isProcessing, scoreLabel, statusLabel } from "#/features/exam/components/result/helpers"
import type { ExamResultMcqSummary, SessionResultsData } from "#/features/exam/types"
import { cn } from "#/lib/utils"

export function ResultSummaryBanner({ result }: { readonly result: SessionResultsData }) {
	const { summary } = result
	const { overall, display } = summary
	const hasBand = overall.band !== null
	const processing = isProcessing(summary)
	const bandValue = hasBand ? bandLabel(overall.band) : display.band_value
	const totalScore =
		overall.score_on_10 === null ? display.total_score_value : scoreLabel(overall.score_on_10)
	const outcomeLabel =
		overall.result_label ?? overall.vstep_level ?? overall.cefr_level ?? statusLabel(summary.score_status)

	return (
		<section className="shrink-0 rounded-2xl border border-border bg-card p-4 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-xs font-black uppercase tracking-[0.16em] text-muted">Tổng quan</p>
					<p className="mt-1 text-sm font-bold text-foreground">{outcomeLabel}</p>
				</div>
				<span
					className={cn(
						"rounded-full border px-2.5 py-1 text-[11px] font-black",
						statusClass(summary.score_status),
					)}
				>
					{statusLabel(summary.score_status)}
				</span>
			</div>

			<div className="mt-5 rounded-2xl border border-primary/25 bg-primary-tint/55 p-4">
				<p className="text-xs font-black uppercase tracking-[0.14em] text-primary-dark">Band hiện tại</p>
				<div className="mt-2 flex items-end gap-3">
					<p className="text-6xl font-black leading-none text-foreground tabular-nums">{bandValue}</p>
					<div className="pb-1">
						<p className="text-sm font-black text-foreground">{display.band_title}</p>
						<p className="mt-0.5 text-xs font-bold text-muted">{display.total_score_title}</p>
					</div>
				</div>
			</div>

			<div className="mt-3 grid grid-cols-2 gap-2">
				<InfoPill label="Điểm tổng" value={totalScore} tone={hasBand ? "success" : "muted"} />
				<McqMetric mcq={summary.mcq} />
			</div>

			{processing && (
				<Notice
					text={
						display.pending_badge_label ??
						"Writing/Speaking đang được chấm, kết quả sẽ tự cập nhật khi hoàn tất."
					}
				/>
			)}
			{!processing && !hasBand && overall.reason && <Notice text={overall.reason} />}
		</section>
	)
}

function Notice({ text }: { readonly text: string }) {
	return (
		<div className="mt-3 flex items-start gap-2 rounded-xl border border-warning/25 bg-warning-tint/45 px-3 py-2 text-xs font-bold text-foreground">
			<Icon name="timer" size="xs" className="mt-0.5 shrink-0 text-warning" />
			<p className="leading-5">{text}</p>
		</div>
	)
}

function statusClass(status: SessionResultsData["summary"]["score_status"]): string {
	if (status === "ready") return "border-success/35 bg-success/10 text-success"
	if (status === "pending" || status === "partial") return "border-warning/35 bg-warning-tint text-warning"
	if (status === "failed") return "border-destructive/35 bg-destructive-tint text-destructive"
	return "border-border bg-background text-muted"
}

function McqMetric({ mcq }: { readonly mcq: ExamResultMcqSummary }) {
	if (mcq.total === 0) return <InfoPill label="Nghe + Đọc" value="—" tone="muted" />

	return (
		<InfoPill
			label="Nghe + Đọc"
			value={`${mcq.correct}/${mcq.total}`}
			tone={mcq.wrong > 0 || mcq.unanswered > 0 ? "warning" : "success"}
		/>
	)
}

function InfoPill({
	label,
	value,
	tone,
}: {
	readonly label: string
	readonly value: string
	readonly tone: "success" | "warning" | "muted"
}) {
	return (
		<div className={cn("min-h-16 rounded-xl border px-3 py-2 text-xs font-bold", metricTone(tone))}>
			<p className="text-muted">{label}</p>
			<p className="mt-1 truncate text-base font-black text-foreground tabular-nums">{value}</p>
		</div>
	)
}

function metricTone(tone: "success" | "warning" | "muted"): string {
	if (tone === "success") return "border-success/25 bg-success/5"
	if (tone === "warning") return "border-warning/25 bg-warning-tint/45"
	return "border-border bg-background"
}
