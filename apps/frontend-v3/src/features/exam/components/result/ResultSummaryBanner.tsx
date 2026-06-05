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
		<section className="shrink-0 rounded-(--radius-card) border border-border bg-card px-3 py-2.5 shadow-sm sm:px-4">
			<div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
				<div className="flex min-w-0 flex-wrap items-center gap-2.5">
					<div className="flex min-h-10 shrink-0 items-baseline gap-2 rounded-(--radius-button) border border-primary/30 bg-primary-tint px-3 py-1.5">
						<span className="text-xs font-extrabold text-primary-dark">Band</span>
						<span className="text-2xl font-black leading-none text-foreground tabular-nums">{bandValue}</span>
					</div>

					<div className="min-w-0">
						<p className="truncate text-sm font-extrabold text-foreground">{outcomeLabel}</p>
						<p className="truncate text-xs font-bold text-muted">{display.band_title}</p>
					</div>
				</div>

				<div className="flex min-w-0 flex-wrap items-center gap-2">
					<InfoPill label="Tổng" value={totalScore} tone={hasBand ? "success" : "muted"} />
					<McqMetric mcq={summary.mcq} />
					{processing && (
						<InfoPill
							label="Writing/Speaking"
							value={display.pending_badge_label ?? "Đang chấm"}
							tone="warning"
							icon="timer"
						/>
					)}
					{!processing && !hasBand && overall.reason && (
						<InfoPill label="Xếp bậc" value={overall.reason} tone="warning" />
					)}
				</div>
			</div>
		</section>
	)
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
	icon,
}: {
	readonly label: string
	readonly value: string
	readonly tone: "success" | "warning" | "muted"
	readonly icon?: "timer"
}) {
	return (
		<span
			className={cn(
				"inline-flex min-h-9 max-w-full items-center gap-2 rounded-(--radius-button) border px-2.5 py-1.5 text-xs font-bold",
				metricTone(tone),
			)}
		>
			{icon && <Icon name={icon} size="xs" className="shrink-0" />}
			<span className="shrink-0 text-muted">{label}</span>
			<span className="min-w-0 truncate font-black text-foreground tabular-nums">{value}</span>
		</span>
	)
}

function metricTone(tone: "success" | "warning" | "muted"): string {
	if (tone === "success") return "border-success/25 bg-success/5"
	if (tone === "warning") return "border-warning/25 bg-warning-tint/45"
	return "border-border bg-background"
}
