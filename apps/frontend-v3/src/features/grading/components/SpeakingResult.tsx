import { useQuery } from "@tanstack/react-query"
import { FeedbackSection } from "#/features/grading/components/FeedbackSection"
import { RubricBar } from "#/features/grading/components/RubricBar"
import { feedbackImprovements } from "#/features/grading/feedback"
import { speakingResultQuery } from "#/features/grading/queries"
import type { RubricMeta, SpeakingGradingResult } from "#/features/grading/types"
import { round } from "#/lib/utils"

const COLOR = "var(--color-skill-speaking)"

interface Props {
	submissionId: string
}

interface MetricValue {
	value: number | null | undefined
	multiplier?: number
	suffix?: string
}

interface DiagnosticMetricProps {
	label: string
	metric: MetricValue
}

export function SpeakingResult({ submissionId }: Props) {
	const { data, isLoading } = useQuery({
		...speakingResultQuery(submissionId),
		refetchInterval: (query) => (query.state.data?.data ? false : 3000),
	})
	const result = data?.data
	const rubric = data?.rubric ?? null

	if (isLoading || !result) {
		return (
			<div className="text-center py-12">
				<img src="/mascot/lac-happy.png" alt="" className="w-20 h-20 mx-auto mb-4 object-contain" />
				<p className="font-bold text-lg text-foreground">AI đang chấm bài...</p>
				<p className="text-sm text-muted mt-1">Thường mất 10–30 giây, trang sẽ tự cập nhật</p>
				<div className="mt-4 w-32 h-1.5 bg-background rounded-full mx-auto overflow-hidden">
					<div className="h-full bg-skill-speaking rounded-full animate-pulse" style={{ width: "60%" }} />
				</div>
			</div>
		)
	}

	const diagnostics = result.diagnostics
	const pronScore = result.pronunciation_report?.accuracy_score ?? diagnostics?.pronunciation?.overall ?? null

	return (
		<div className="space-y-6">
			<div className="card p-6 text-center">
				<p className="text-xs font-bold uppercase tracking-wide text-muted mb-1">Điểm tổng</p>
				<p className="text-5xl font-extrabold tabular-nums" style={{ color: COLOR }}>
					{round(result.overall_band)}
				</p>
				<p className="text-sm text-muted mt-1">
					{rubric ? `/ ${rubric.max_score}` : "Chưa có dữ liệu thang điểm"}
				</p>
			</div>

			{isNumber(pronScore) && (
				<div className="card p-4 flex items-center gap-3">
					<div
						className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm text-primary-foreground"
						style={{ backgroundColor: COLOR }}
					>
						{round(pronScore)}
					</div>
					<div>
						<p className="text-sm font-bold text-foreground">Pronunciation Accuracy</p>
						<p className="text-xs text-muted">Đánh giá từ phân tích âm thanh</p>
					</div>
				</div>
			)}

			<SpeakingDiagnosticsPanel result={result} />

			<RubricPanel result={result} rubric={rubric} />

			<div className="card p-6">
				<FeedbackSection
					strengths={result.feedback?.strengths ?? []}
					improvements={feedbackImprovements(result.feedback)}
				/>
			</div>

			{result.transcript && !diagnostics && (
				<div className="card p-6">
					<p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Transcript</p>
					<p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{result.transcript}</p>
				</div>
			)}
		</div>
	)
}

function RubricPanel({ result, rubric }: { result: SpeakingGradingResult; rubric: RubricMeta | null }) {
	if (!rubric) {
		return (
			<div className="card p-6">
				<p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Rubric</p>
				<p className="text-sm text-subtle">Chưa có dữ liệu rubric cho bài này.</p>
			</div>
		)
	}

	return (
		<div className="card p-6 space-y-3">
			<p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Rubric</p>
			{result.criterion_scores.map((criterion) => (
				<RubricBar
					key={criterion.key}
					label={criterionLabel(rubric, criterion.key)}
					score={criterion.score}
					max={criterionMax(rubric, criterion.key)}
					color={COLOR}
				/>
			))}
		</div>
	)
}

function SpeakingDiagnosticsPanel({ result }: { result: SpeakingGradingResult }) {
	const diagnostics = result.diagnostics
	if (!diagnostics) {
		return (
			<div className="card p-6">
				<p className="text-xs font-bold uppercase tracking-wide text-muted">Chẩn đoán bài nói</p>
				<p className="mt-2 text-sm text-subtle">
					Chưa có dữ liệu chẩn đoán âm thanh cho bài này. Hệ thống không tự điền điểm giả định.
				</p>
			</div>
		)
	}

	const transcript = diagnostics.speech?.transcript ?? result.transcript ?? null
	const pronunciation =
		diagnostics.pronunciation?.overall ?? result.pronunciation_report?.accuracy_score ?? null
	const hasMetrics = hasDiagnosticMetrics(result)

	return (
		<div className="card p-6 space-y-4">
			<p className="text-xs font-bold uppercase tracking-wide text-muted">Chẩn đoán bài nói</p>
			{hasMetrics ? (
				<div className="grid gap-2 sm:grid-cols-2">
					<DiagnosticMetric
						label="Tốc độ nói"
						metric={{ value: diagnostics.speech?.speaking_rate, suffix: " từ/phút" }}
					/>
					<DiagnosticMetric label="Số lần ngắt nghỉ" metric={{ value: diagnostics.fluency?.pause_count }} />
					<DiagnosticMetric label="Phát âm" metric={{ value: pronunciation, suffix: "/100" }} />
					<DiagnosticMetric
						label="Nội dung"
						metric={{ value: diagnostics.content?.content_factor, multiplier: 100, suffix: "%" }}
					/>
				</div>
			) : (
				<p className="text-sm text-subtle">
					Chưa có dữ liệu chẩn đoán âm thanh cho bài này. Hệ thống không tự điền điểm giả định.
				</p>
			)}
			{transcript && (
				<div className="rounded-(--radius-card) border-2 border-border bg-background/40 p-3">
					<p className="text-[10px] font-bold uppercase tracking-wide text-subtle mb-1">Transcript</p>
					<p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{transcript}</p>
				</div>
			)}
		</div>
	)
}

function criterionLabel(rubric: RubricMeta, key: string): string {
	return rubric.criteria.find((criterion) => criterion.key === key)?.label ?? key
}

function criterionMax(rubric: RubricMeta, key: string): number {
	return rubric.criteria.find((criterion) => criterion.key === key)?.max ?? rubric.max_score
}

function hasDiagnosticMetrics(result: SpeakingGradingResult): boolean {
	const diagnostics = result.diagnostics
	if (!diagnostics) return false

	return [
		diagnostics.speech?.speaking_rate,
		diagnostics.fluency?.pause_count,
		diagnostics.pronunciation?.overall,
		result.pronunciation_report?.accuracy_score,
		diagnostics.content?.content_factor,
	].some(isNumber)
}

function isNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value)
}

function DiagnosticMetric({ label, metric }: DiagnosticMetricProps) {
	const multiplier = metric.multiplier ?? 1
	const suffix = metric.suffix ?? ""
	const displayValue = isNumber(metric.value)
		? `${round(metric.value * multiplier)}${suffix}`
		: "Chưa có dữ liệu"

	return (
		<div className="rounded-xl bg-background px-3 py-2">
			<p className="text-[10px] font-bold uppercase text-subtle">{label}</p>
			<p className="text-sm font-extrabold text-foreground">{displayValue}</p>
		</div>
	)
}
