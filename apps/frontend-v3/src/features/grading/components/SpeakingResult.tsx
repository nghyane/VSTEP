import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FeedbackSection } from "#/features/grading/components/FeedbackSection"
import { RubricBar } from "#/features/grading/components/RubricBar"
import { feedbackImprovements } from "#/features/grading/feedback"
import { requestTeacherGrading, speakingResultQuery } from "#/features/grading/queries"
import type {
	RubricMeta,
	SpeakingGradingResult,
	TeacherGradingRequestState,
	TeacherGradingRequestStatus,
	TeacherGradingResultState,
} from "#/features/grading/types"
import { censorProfanityText, censorProfanityWords } from "#/lib/profanity"
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
	const queryClient = useQueryClient()
	const { data, isLoading } = useQuery({
		...speakingResultQuery(submissionId),
		refetchInterval: (query) => (query.state.data?.data ? false : 3000),
	})
	const result = data?.data
	const rubric = data?.rubric ?? null
	const attemptId = data?.attempt_id ?? null
	const teacherGradingState = data?.teacher_grading_request ?? null
	const teacherGrading = useMutation({
		mutationFn: () => requestTeacherGrading(attemptId ?? ""),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["practice", "speaking", "result", submissionId] })
		},
		onError: () => {},
	})

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
	const teacherGradingStatus = teacherGrading.data?.data.status ?? teacherGradingState?.status ?? "none"

	return (
		<div className="space-y-6">
			<div className="card p-6 text-center">
				<p className="text-xs font-bold uppercase tracking-wide text-muted mb-1">Điểm AI</p>
				<p className="text-5xl font-extrabold tabular-nums" style={{ color: COLOR }}>
					{round(result.overall_band)}
				</p>
				<p className="text-sm text-muted mt-1">
					{rubric ? `/ ${rubric.max_score}` : "Chưa có dữ liệu thang điểm"}
				</p>
				<p className="mt-2 inline-flex rounded-full bg-primary-tint px-2.5 py-1 text-[10px] font-extrabold uppercase text-primary-dark">
					Nguồn: AI tự động
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

			<SpeakingProfanityWarning result={result} />

			<RubricPanel result={result} rubric={rubric} />

			<div className="card p-6">
				<FeedbackSection
					strengths={result.feedback?.strengths ?? []}
					improvements={feedbackImprovements(result.feedback)}
				/>
			</div>

			<TeacherGradingPanel
				attemptId={attemptId}
				canRequest={teacherGradingState?.can_request === true}
				requested={teacherGrading.isSuccess || teacherGradingState?.requested === true}
				status={teacherGradingStatus}
				assignedTeacher={teacherGradingState?.assigned_teacher ?? null}
				result={teacherGradingState?.teacher_result ?? null}
				pending={teacherGrading.isPending}
				error={errorMessage(teacherGrading.error)}
				onRequest={() => teacherGrading.mutate()}
			/>

			{result.transcript && !diagnostics && (
				<div className="card p-6">
					<p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Transcript</p>
					<p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{result.transcript}</p>
				</div>
			)}
		</div>
	)
}

function TeacherGradingPanel({
	attemptId,
	canRequest,
	requested,
	status,
	assignedTeacher,
	result,
	pending,
	error,
	onRequest,
}: {
	attemptId: string | null
	canRequest: boolean
	requested: boolean
	status: TeacherGradingRequestStatus
	assignedTeacher: TeacherGradingRequestState["assigned_teacher"]
	result: TeacherGradingResultState | null
	pending: boolean
	error: string | null
	onRequest: () => void
}) {
	if (!attemptId || (!canRequest && !result)) return null

	const isTeacherGraded = result !== null || status === "completed"
	const hasRequested = requested || status !== "none"
	const disabled = pending || hasRequested || isTeacherGraded

	return (
		<div className="card p-5 space-y-3 border-l-4 border-l-info">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className="text-xs font-bold uppercase tracking-wide text-subtle">Teacher review</p>
					<p className="mt-1 text-base font-extrabold text-foreground">
						{isTeacherGraded ? "Giáo viên đã chấm" : "Yêu cầu giáo viên chấm"}
					</p>
					<p className="mt-1 text-sm text-muted">
						{teacherGradingText(status, result !== null, hasRequested)}
					</p>
				</div>
				<span className="self-start rounded-full bg-info-tint px-2.5 py-1 text-[10px] font-extrabold uppercase text-info">
					{teacherGradingLabel(status, isTeacherGraded, hasRequested)}
				</span>
			</div>
			{assignedTeacher && (
				<p className="rounded-2xl bg-background/50 px-3 py-2 text-xs text-muted">
					Giáo viên phụ trách: <span className="font-bold text-foreground">{assignedTeacher.full_name}</span>
				</p>
			)}
			{result && <TeacherResultSummary result={result} />}
			{!isTeacherGraded && !hasRequested && (
				<button
					type="button"
					onClick={onRequest}
					disabled={disabled}
					className="btn btn-secondary px-5 py-2.5 text-sm disabled:opacity-50"
				>
					{pending ? "Đang gửi..." : "Gửi yêu cầu"}
				</button>
			)}
			{error && <p className="text-xs font-bold text-destructive">{error}</p>}
		</div>
	)
}

function TeacherResultSummary({ result }: { result: TeacherGradingResultState }) {
	const strengths = result.feedback?.strengths ?? []
	const improvements = feedbackImprovements(result.feedback)
	const hasFeedback = strengths.length > 0 || improvements.length > 0

	return (
		<div className="rounded-2xl bg-background/50 p-4">
			<div className="flex items-end justify-between gap-3">
				<div>
					<p className="text-[10px] font-bold uppercase tracking-wide text-subtle">Điểm giáo viên</p>
					<p className="mt-1 text-4xl font-extrabold tabular-nums text-info">{round(result.overall_band)}</p>
				</div>
				<span className="rounded-full bg-info-tint px-2.5 py-1 text-[10px] font-extrabold uppercase text-info">
					Nguồn: Giáo viên
				</span>
			</div>
			{hasFeedback && (
				<div className="mt-3 border-t-2 border-border pt-3">
					<FeedbackSection strengths={strengths} improvements={improvements} />
				</div>
			)}
		</div>
	)
}

function teacherGradingLabel(
	status: TeacherGradingRequestStatus,
	isTeacherGraded: boolean,
	requested: boolean,
): string {
	if (isTeacherGraded) return "Đã chấm"
	switch (status) {
		case "pending_assignment":
			return "Chờ gán"
		case "assigned":
			return "Đã gán"
		case "in_progress":
			return "Đang chấm"
		case "rejected":
			return "Từ chối"
		case "cancelled":
			return "Đã hủy"
		default:
			return requested ? "Đã gửi" : "Chưa gửi"
	}
}

function teacherGradingText(
	status: TeacherGradingRequestStatus,
	hasTeacherResult: boolean,
	requested: boolean,
): string {
	if (hasTeacherResult)
		return "Bên dưới là điểm giáo viên. Điểm AI vẫn được giữ riêng ở khối kết quả phía trên."
	switch (status) {
		case "pending_assignment":
			return "Yêu cầu đã gửi. Staff sẽ kiểm tra và gán giáo viên phù hợp."
		case "assigned":
			return "Yêu cầu đã được gán cho giáo viên. Bạn sẽ nhận thông báo khi có kết quả."
		case "in_progress":
			return "Giáo viên đang chấm bài. Bạn sẽ nhận thông báo khi hoàn tất."
		case "rejected":
			return "Yêu cầu chưa được duyệt. Vui lòng liên hệ trung tâm nếu cần hỗ trợ."
		case "cancelled":
			return "Yêu cầu đã được hủy."
		default:
			return requested
				? "Yêu cầu đã gửi. Staff sẽ kiểm tra và gán giáo viên phù hợp."
				: "Gửi bài nói cho staff để gán giáo viên chấm thủ công. Điểm giáo viên sẽ hiển thị riêng với điểm hệ thống."
	}
}

function errorMessage(error: unknown): string | null {
	return error instanceof Error ? error.message : null
}

function SpeakingProfanityWarning({ result }: { result: SpeakingGradingResult }) {
	const profanity = result.diagnostics?.profanity
	if (!profanity?.found) return null

	return (
		<div className="card p-4 border-l-4 border-l-warning bg-warning/5">
			<div className="flex items-start gap-3">
				<span className="text-warning text-lg shrink-0">⚠</span>
				<div>
					<p className="text-sm font-bold text-warning">
						Phát hiện từ ngữ không phù hợp trong bài nói ({profanity.count} lần)
					</p>
					<p className="mt-1 text-sm text-muted">
						Transcript có chứa:{" "}
						<span className="font-bold text-foreground">{censorProfanityWords(profanity.words)}</span>. Nên
						tránh trong bài thi nói học thuật.
					</p>
				</div>
			</div>
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
	const displayTranscript =
		diagnostics.profanity?.found && transcript ? censorProfanityText(transcript) : transcript
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
					<DiagnosticMetric label="Phát âm" metric={{ value: pronunciation, suffix: "/10" }} />
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
			{displayTranscript && (
				<div className="rounded-(--radius-card) border-2 border-border bg-background/40 p-3">
					<p className="text-[10px] font-bold uppercase tracking-wide text-subtle mb-1">Transcript</p>
					<p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{displayTranscript}</p>
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
