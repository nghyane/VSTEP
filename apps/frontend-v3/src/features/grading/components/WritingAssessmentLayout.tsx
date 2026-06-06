import { Link } from "@tanstack/react-router"
import clsx from "clsx"
import type { ReactNode } from "react"
import { DuoProgressBar } from "#/components/DuoProgressBar"
import { StaticIcon } from "#/components/Icon"
import { FeedbackSection, RewriteSection } from "#/features/grading/components/FeedbackSection"
import { RubricBar } from "#/features/grading/components/RubricBar"
import { feedbackImprovements } from "#/features/grading/feedback"
import type {
	AssessmentAnnotation,
	AssessmentFeedback,
	AssessmentResultDisplay,
	GradingProgress,
	Rewrite,
	RubricMeta,
	TeacherGradingRequestStatus,
	TeacherGradingResultState,
	WritingGradingResult,
} from "#/features/grading/types"
import { censorProfanityText, censorProfanityWords } from "#/lib/profanity"
import { formatShortDate, round } from "#/lib/utils"

const COLOR = "var(--color-skill-writing)"

export interface WritingAssessmentContext {
	taskLabel?: string
	title?: string
	prompt?: string
	responseText?: string
	wordCount?: number
	submittedAt?: string
}

export interface WritingFeedbackAction {
	cost: number
	canRequest: boolean
	pending: boolean
	requested: boolean
	error: string | null
	generated: AssessmentFeedback | null
	onRequest: () => void
}

export interface TeacherGradingAction {
	canRequest: boolean
	requested: boolean
	status: TeacherGradingRequestStatus
	assignedTeacher: { id: string; full_name: string | null; email: string | null } | null
	result: TeacherGradingResultState | null
	pending: boolean
	error: string | null
	onRequest: () => void
}

export interface WritingAssessmentView {
	result: WritingGradingResult
	rubric: RubricMeta | null
	context: WritingAssessmentContext | null
	feedback: WritingFeedbackAction
	teacherGrading: TeacherGradingAction
}

interface LayoutProps {
	view: WritingAssessmentView
}

interface PendingProps {
	context?: WritingAssessmentContext | null
	progress: GradingProgress[]
}

interface ErrorProps {
	message: string | null
}

export function WritingAssessmentLayout({ view }: LayoutProps) {
	return (
		<div className="grid gap-6 lg:grid-cols-[minmax(300px,360px)_1fr] items-start">
			<aside className="space-y-4 lg:sticky lg:top-6">
				<ResultHero view={view} />
				<QuickStats result={view.result} />
			</aside>
			<section className="space-y-4">
				<WritingPaperPanel context={view.context} result={view.result} />
				<NotAssessablePanel display={view.result.display} />
				<RequirementPanel result={view.result} />
				<ProfanityWarning result={view.result} />
				<RubricPanel view={view} />
				<DiagnosticsPanel result={view.result} />
				<FeedbackPanel view={view} />
				<TeacherGradingPanel action={view.teacherGrading} />
			</section>
		</div>
	)
}

export function WritingAssessmentPending({ context, progress }: PendingProps) {
	return (
		<div className="grid gap-6 lg:grid-cols-[minmax(300px,360px)_1fr] items-start">
			<div className="card p-6 text-center space-y-4">
				<img src="/mascot/lac-happy.png" alt="" className="w-20 h-20 mx-auto object-contain" />
				<div>
					<p className="font-bold text-lg text-foreground">Hệ thống đang chấm bài...</p>
					<p className="text-sm text-subtle mt-1">Đang phân tích ngữ pháp, từ vựng và yêu cầu đề bài</p>
				</div>
				<DuoProgressBar
					value={progressValue(progress)}
					tone="primary"
					heightPx={10}
					label="Tiến độ chấm bài"
				/>
			</div>
			<div className="space-y-4">
				<ContextCard context={context ?? null} />
				<div className="card p-6 space-y-3">
					<p className="text-xs font-bold uppercase tracking-wide text-subtle">Quy trình chấm</p>
					<ProgressStep active={progress.length >= 0} label="Đọc bài và nhận diện yêu cầu" />
					<ProgressStep active={progress.length >= 1} label="Trích xuất bằng chứng theo rubric" />
					<ProgressStep active={progress.length >= 2} label="Tính điểm từng tiêu chí" />
					<ProgressStep active={progress.length >= 3} label="Tạo nhận xét cải thiện" />
				</div>
			</div>
		</div>
	)
}

export function WritingAssessmentError({ message }: ErrorProps) {
	return (
		<div className="card max-w-lg mx-auto p-8 text-center space-y-4">
			<img src="/mascot/lac-sad.png" alt="" className="w-20 h-20 mx-auto object-contain" />
			<div>
				<p className="font-bold text-lg text-foreground">Có lỗi khi chấm bài</p>
				<p className="text-sm text-subtle mt-1">{message ?? "Vui lòng thử lại sau."}</p>
			</div>
			<Link to="/luyen-tap/viet" className="inline-flex text-sm font-bold text-skill-writing">
				Quay lại luyện viết
			</Link>
		</div>
	)
}

function ResultHero({ view }: LayoutProps) {
	const display = view.result.display
	const showScore = (display?.ui.show_score ?? true) && display?.status !== "not_assessable"
	const tone = display?.ui.tone ?? "success"
	const statusLabel = display?.status_label ?? "Kết quả bài viết"
	const scoreLabel = `${round(display?.score.value ?? view.result.overall_band)}`
	const maxScore = display?.score.max ?? view.rubric?.max_score

	return (
		<div className={clsx("card p-5 space-y-4 border-l-6", toneBorder(tone))}>
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-xs font-bold uppercase tracking-wide text-subtle">Kết quả</p>
					<p className="mt-1 text-lg font-extrabold text-foreground">{statusLabel}</p>
				</div>
				<span
					className={clsx("rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase", toneBadge(tone))}
				>
					{display?.ui.badge ?? display?.level_label ?? "Đã chấm"}
				</span>
			</div>
			{showScore ? (
				<div>
					<p className="text-6xl font-extrabold tabular-nums text-skill-writing">{scoreLabel}</p>
					<p className="text-sm text-subtle mt-1">{maxScore ? `/ ${maxScore}` : "Điểm tổng theo rubric"}</p>
					<p className="mt-2 inline-flex rounded-full bg-primary-tint px-2.5 py-1 text-[10px] font-extrabold uppercase text-primary-dark">
						Nguồn: AI tự động
					</p>
				</div>
			) : (
				<div className="rounded-2xl bg-warning/10 px-4 py-3">
					<p className="text-sm font-bold text-warning">Cần viết lại trước khi chấm điểm.</p>
				</div>
			)}
			{display?.message && (
				<p className="text-sm leading-relaxed text-muted line-clamp-2">{display.message}</p>
			)}
		</div>
	)
}

function ContextCard({ context }: { context: WritingAssessmentContext | null }) {
	if (!context) {
		return (
			<div className="card p-5">
				<p className="text-xs font-bold uppercase tracking-wide text-subtle">Bài viết</p>
				<p className="text-sm text-muted mt-2">Mở từ lịch sử luyện tập để xem kết quả chấm.</p>
			</div>
		)
	}

	return (
		<div className="card p-5 space-y-3">
			<div>
				<p className="text-xs font-bold uppercase tracking-wide text-subtle">Bài viết</p>
				<p className="font-bold text-foreground mt-1">{context.title ?? "Bài viết luyện tập"}</p>
				{context.taskLabel && (
					<p className="text-xs font-bold text-skill-writing mt-1">{context.taskLabel}</p>
				)}
			</div>
			<ContextMeta context={context} />
			{context.prompt && (
				<details className="rounded-(--radius-card) border-2 border-border bg-background/40">
					<summary className="cursor-pointer px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-subtle">
						Đề bài
					</summary>
					<p className="whitespace-pre-wrap px-3 pb-3 text-sm leading-relaxed text-foreground">
						{context.prompt}
					</p>
				</details>
			)}
			{context.responseText && (
				<details className="rounded-(--radius-card) border-2 border-border bg-background/40">
					<summary className="cursor-pointer px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-subtle">
						Bài làm của bạn
					</summary>
					<p className="whitespace-pre-wrap px-3 pb-3 text-sm leading-relaxed text-foreground">
						{context.responseText}
					</p>
				</details>
			)}
		</div>
	)
}

function ContextMeta({ context }: { context: WritingAssessmentContext }) {
	return (
		<div className="grid grid-cols-2 gap-2">
			{context.wordCount !== undefined && (
				<div className="rounded-xl bg-background px-3 py-2">
					<p className="text-[10px] font-bold uppercase text-subtle">Số từ</p>
					<p className="text-sm font-extrabold text-foreground">{context.wordCount}</p>
				</div>
			)}
			{context.submittedAt && (
				<div className="rounded-xl bg-background px-3 py-2">
					<p className="text-[10px] font-bold uppercase text-subtle">Ngày nộp</p>
					<p className="text-sm font-extrabold text-foreground">{formatShortDate(context.submittedAt)}</p>
				</div>
			)}
		</div>
	)
}

function WritingPaperPanel({
	context,
	result,
}: {
	context: WritingAssessmentContext | null
	result: WritingGradingResult
}) {
	if (!context) return <ContextCard context={context} />
	const responseText = result.diagnostics?.profanity?.found
		? censorProfanityText(context.responseText ?? "")
		: context.responseText

	return (
		<div className="card p-5 space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className="text-xs font-bold uppercase tracking-wide text-subtle">Bài viết</p>
					<p className="mt-1 text-lg font-extrabold text-foreground">
						{context.title ?? "Bài viết luyện tập"}
					</p>
					{context.taskLabel && (
						<p className="mt-1 text-xs font-bold text-skill-writing">{context.taskLabel}</p>
					)}
				</div>
				<ContextMeta context={context} />
			</div>

			{context.prompt && (
				<section className="rounded-2xl border-2 border-border bg-background/40 p-4">
					<p className="text-xs font-extrabold uppercase tracking-wide text-subtle">Đề bài</p>
					<p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">{context.prompt}</p>
				</section>
			)}

			{responseText && (
				<section className="rounded-2xl border-2 border-border bg-background/40 p-4">
					<div className="mb-2 flex items-center justify-between gap-3">
						<p className="text-xs font-extrabold uppercase tracking-wide text-subtle">Bài làm của bạn</p>
						{(result.diagnostics?.annotations.length ?? 0) > 0 && (
							<p className="text-[10px] font-bold text-muted">Gạch chân = lỗi</p>
						)}
					</div>
					<p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
						<AnnotatedWritingText text={responseText} annotations={result.diagnostics?.annotations ?? []} />
					</p>
				</section>
			)}
		</div>
	)
}

function RubricPanel({ view }: LayoutProps) {
	const rubric = view.rubric
	const showRubric = view.result.display?.ui.show_criterion_breakdown ?? true
	if (!showRubric) return null
	if (!rubric) {
		return (
			<div className="card p-6">
				<p className="text-xs font-bold uppercase tracking-wide text-subtle">Rubric</p>
				<p className="mt-2 text-sm text-muted">Chưa có dữ liệu rubric cho bài này.</p>
			</div>
		)
	}

	return (
		<div className="card p-5 space-y-3">
			<div>
				<p className="text-xs font-bold uppercase tracking-wide text-subtle">Điểm theo tiêu chí</p>
			</div>
			<div className="grid gap-3 sm:grid-cols-2">
				{view.result.criterion_scores.map((criterion) => (
					<div key={criterion.key} className="rounded-2xl bg-background/50 p-3">
						<RubricBar
							label={criterionLabel(rubric, criterion.key)}
							score={criterion.score}
							max={criterionMax(rubric, criterion.key)}
							color={COLOR}
						/>
					</div>
				))}
			</div>
		</div>
	)
}

function FeedbackPanel({ view }: LayoutProps) {
	const aiFeedback = view.feedback.generated ?? detailedAIFeedback(view.result.feedback)
	const showFeedback = view.result.display?.ui.show_feedback ?? true
	if (!showFeedback) return null

	return (
		<div id="ai-writing-feedback" className="card p-5 space-y-4">
			<PanelHeader
				title={aiFeedback ? "Nhận xét AI" : "AI Coach"}
				subtitle={aiFeedback ? undefined : "Mở phân tích điểm mạnh, điểm yếu và câu viết lại."}
			/>
			<AIFeedbackButton action={view.feedback} hasFeedback={aiFeedback !== null} />
			{view.feedback.pending && <AIFeedbackLoading />}
			{aiFeedback && (
				<div className="space-y-4 border-t-2 border-border pt-4">
					<FeedbackSection
						strengths={aiFeedback.strengths ?? []}
						improvements={feedbackImprovements(aiFeedback)}
					/>
					{aiFeedback.rewrites && aiFeedback.rewrites.length > 0 && (
						<RewriteSection rewrites={normalizeRewrites(aiFeedback.rewrites)} />
					)}
				</div>
			)}
		</div>
	)
}

function NotAssessablePanel({ display }: { display?: AssessmentResultDisplay }) {
	if (display?.status !== "not_assessable") return null

	return (
		<div className="card border-l-4 border-l-destructive bg-destructive/5 p-5">
			<p className="text-xs font-bold uppercase tracking-wide text-destructive">Không chấm điểm rubric</p>
			<p className="mt-2 text-base font-extrabold text-foreground">
				{display.reason.label ?? display.status_label}
			</p>
			<p className="mt-1 text-sm leading-6 text-muted">{notAssessableDetail(display)}</p>
		</div>
	)
}

function PanelHeader({ title, subtitle }: { title: string; subtitle?: string }) {
	return (
		<div>
			<p className="text-xs font-bold uppercase tracking-wide text-subtle">{title}</p>
			{subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
		</div>
	)
}

function AIFeedbackLoading() {
	return (
		<div className="border-t-2 border-border pt-4">
			<div className="flex items-center gap-2">
				<div className="flex gap-1">
					<div className="size-2 rounded-full bg-skill-writing animate-[dotBounce_1.2s_ease-in-out_infinite]" />
					<div
						className="size-2 rounded-full bg-skill-writing animate-[dotBounce_1.2s_ease-in-out_infinite]"
						style={{ animationDelay: "0.2s" }}
					/>
					<div
						className="size-2 rounded-full bg-skill-writing animate-[dotBounce_1.2s_ease-in-out_infinite]"
						style={{ animationDelay: "0.4s" }}
					/>
				</div>
				<p className="text-sm font-bold text-muted">AI đang phân tích bài viết...</p>
			</div>
		</div>
	)
}

function AIFeedbackButton({ action, hasFeedback }: { action: WritingFeedbackAction; hasFeedback: boolean }) {
	if (!action.canRequest) return null
	const disabled = action.pending
	const label = action.pending
		? "Đang xử lý..."
		: hasFeedback
			? "Xem nhận xét AI"
			: action.requested
				? "Tải nhận xét AI"
				: "Nhận xét từ AI"
	const handleClick = () => {
		if (hasFeedback) {
			document.getElementById("ai-writing-feedback")?.scrollIntoView({ behavior: "smooth", block: "start" })
			return
		}
		if (!hasFeedback) action.onRequest()
	}

	return (
		<div className={hasFeedback ? "" : "rounded-2xl bg-background/50 p-3"}>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-xs text-subtle">
					{hasFeedback ? (
						"Đã có nhận xét."
					) : action.requested ? (
						"Đã thanh toán."
					) : (
						<span className="inline-flex items-center gap-1.5">
							<StaticIcon name="coin" size="xs" className="h-3.5 w-auto -translate-y-0.5" /> {action.cost} xu
						</span>
					)}
				</p>
				<div className="relative inline-flex self-start sm:self-auto">
					<button
						type="button"
						onClick={handleClick}
						disabled={disabled}
						className="btn btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
					>
						{label}
					</button>
				</div>
			</div>
			{action.error && <p className="mt-2 text-xs font-bold text-destructive">{action.error}</p>}
		</div>
	)
}

function TeacherGradingPanel({ action }: { action: TeacherGradingAction }) {
	if (!action.canRequest && !action.result) return null

	const isTeacherGraded = action.result !== null || action.status === "completed"
	const requested = action.requested || action.status !== "none"
	const disabled = action.pending || requested || isTeacherGraded
	const title = isTeacherGraded ? "Giáo viên đã chấm" : "Yêu cầu giáo viên chấm"
	const description = teacherGradingDescription(action)

	return (
		<div className="card p-5 space-y-3 border-l-4 border-l-info">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className="text-xs font-bold uppercase tracking-wide text-subtle">Teacher review</p>
					<p className="mt-1 text-base font-extrabold text-foreground">{title}</p>
					<p className="mt-1 text-sm text-muted">{description}</p>
				</div>
				<span className="self-start rounded-full bg-info-tint px-2.5 py-1 text-[10px] font-extrabold uppercase text-info">
					{teacherGradingLabel(action.status, isTeacherGraded)}
				</span>
			</div>
			{action.assignedTeacher && (
				<p className="rounded-2xl bg-background/50 px-3 py-2 text-xs text-muted">
					Giáo viên phụ trách:{" "}
					<span className="font-bold text-foreground">{action.assignedTeacher.full_name}</span>
				</p>
			)}
			{action.result && <TeacherResultSummary result={action.result} />}
			{!requested && !isTeacherGraded && (
				<button
					type="button"
					onClick={action.onRequest}
					disabled={disabled}
					className="btn btn-secondary px-5 py-2.5 text-sm disabled:opacity-50"
				>
					{action.pending ? "Đang gửi..." : "Gửi yêu cầu"}
				</button>
			)}
			{action.error && <p className="text-xs font-bold text-destructive">{action.error}</p>}
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

function teacherGradingLabel(status: TeacherGradingRequestStatus, isTeacherGraded: boolean): string {
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
			return "Chưa gửi"
	}
}

function teacherGradingDescription(action: TeacherGradingAction): string {
	if (action.result) return "Bên dưới là điểm giáo viên. Điểm AI vẫn được giữ riêng ở khối kết quả phía trên."
	switch (action.status) {
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
			return "Gửi bài cho staff để gán giáo viên chấm thủ công. Điểm giáo viên sẽ hiển thị riêng với điểm AI."
	}
}

function detailedAIFeedback(feedback: AssessmentFeedback | null): AssessmentFeedback | null {
	if (!feedback) return null
	const hasStrengths = (feedback.strengths?.length ?? 0) > 0
	const hasImprovements = (feedback.improvements?.length ?? 0) > 0
	const hasRewrites = (feedback.rewrites?.length ?? 0) > 0

	return hasStrengths || hasImprovements || hasRewrites ? feedback : null
}

function QuickStats({ result }: { result: WritingGradingResult }) {
	const summary = result.diagnostics?.summary
	if (!summary) return null

	return (
		<div className="card p-4 space-y-3">
			<p className="text-xs font-bold uppercase tracking-wide text-subtle">Chỉ số bài viết</p>
			<div className="grid grid-cols-2 gap-1.5">
				<StatPill label="Số từ" value={summary.word_count} />
				<StatPill label="Số câu" value={summary.sentence_count} />
				<StatPill
					label="Lỗi ngữ pháp"
					value={summary.grammar_error_count}
					tone={summary.grammar_error_count ? "warning" : "success"}
				/>
				<StatPill label="Từ nối" value={summary.linking_word_count} />
				<StatPill label="Độ đa dạng từ" value={summary.unique_ratio} multiplier={100} suffix="%" />
				<StatPill label="Đoạn văn" value={summary.paragraph_count} />
			</div>
		</div>
	)
}

function RequirementPanel({ result }: { result: WritingGradingResult }) {
	const diagnostics = result.diagnostics
	if (!diagnostics) return null
	const items: Array<{ label: string; checked: boolean | null; detail?: string }> = []
	const word = diagnostics.word_requirement
	if (word) {
		items.push({
			label: "Đủ số từ tối thiểu",
			checked: word.is_met,
			detail: `${word.actual ?? "?"}/${word.minimum} từ${word.missing ? ` · thiếu ${word.missing}` : ""}`,
		})
	}
	const coverage = diagnostics.task_coverage
	if (coverage) {
		items.push({
			label: "Bao phủ yêu cầu đề bài",
			checked: coverage.covered_points === null ? null : coverage.covered_points >= coverage.required_points,
			detail: `${coverage.covered_points ?? "?"}/${coverage.required_points} ý`,
		})
	}
	const format = diagnostics.format
	if (format?.letter_format_expected) {
		items.push({ label: "Có lời chào phù hợp", checked: format.has_salutation })
		items.push({ label: "Có lời kết phù hợp", checked: format.has_closing })
	}
	if (items.length === 0 && !coverage?.requirements.length) return null

	return (
		<div className="card p-5 space-y-3">
			<div>
				<p className="text-xs font-bold uppercase tracking-wide text-subtle">Checklist yêu cầu</p>
			</div>
			<div className="grid gap-2 sm:grid-cols-2">
				{items.map((item) => (
					<RequirementItem key={item.label} {...item} />
				))}
			</div>
			{coverage?.requirements.length ? (
				<div className="rounded-2xl bg-background/50 p-4 space-y-2">
					<p className="text-[10px] font-bold uppercase tracking-wide text-muted">Chi tiết ý trong đề</p>
					{coverage.requirements.map((requirement) => (
						<RequirementItem key={requirement.text} label={requirement.text} checked={requirement.met} />
					))}
				</div>
			) : null}
		</div>
	)
}

function ProfanityWarning({ result }: { result: WritingGradingResult }) {
	const profanity = result.diagnostics?.profanity
	if (!profanity?.found) return null

	const censored = censorProfanityWords(profanity.words)

	return (
		<div className="card p-4 border-l-4 border-l-warning bg-warning/5">
			<div className="flex items-start gap-3">
				<span className="text-warning text-lg shrink-0">⚠</span>
				<div>
					<p className="text-sm font-bold text-warning">
						Phát hiện từ ngữ không phù hợp ({profanity.count} lần)
					</p>
					<p className="mt-1 text-sm text-muted">
						Bài viết có chứa: <span className="font-bold text-foreground">{censored}</span>. Điểm không bị ảnh
						hưởng nhưng nên tránh trong bài thi học thuật.
					</p>
				</div>
			</div>
		</div>
	)
}

function DiagnosticsPanel({ result }: { result: WritingGradingResult }) {
	const annotations = result.diagnostics?.annotations ?? []
	if (annotations.length === 0) return null
	const visible = annotations.slice(0, 8)

	return (
		<div className="card p-5 space-y-3">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-xs font-bold uppercase tracking-wide text-subtle">Lỗi cần sửa</p>
				</div>
				<span className="rounded-full bg-warning/15 px-2.5 py-1 text-[10px] font-extrabold text-warning">
					{annotations.length} lỗi
				</span>
			</div>
			<div className="space-y-2">
				{visible.map((annotation) => (
					<div
						key={`${annotation.start}-${annotation.message}`}
						className="rounded-2xl border-2 border-border bg-background/40 p-4"
					>
						<div className="flex flex-wrap items-center gap-2">
							<span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-extrabold uppercase text-warning">
								{annotation.type}
							</span>
							<span className="text-xs font-bold text-muted">{annotation.category}</span>
						</div>
						<p className="mt-2 text-sm font-bold text-foreground">“{annotation.text}”</p>
						<p className="mt-1 text-sm text-muted">{annotation.message}</p>
						{annotation.suggestions.length > 0 && (
							<p className="mt-2 text-xs font-bold text-success">
								Gợi ý: {annotation.suggestions.slice(0, 3).join(", ")}
							</p>
						)}
					</div>
				))}
			</div>
			{annotations.length > visible.length && (
				<p className="text-xs text-muted">
					Còn {annotations.length - visible.length} lỗi khác. Hãy ưu tiên các lỗi trên trước.
				</p>
			)}
		</div>
	)
}

function ProgressStep({ active, label }: { active: boolean; label: string }) {
	return (
		<div className="flex items-center gap-3 text-sm">
			<span className={active ? "text-skill-writing" : "text-muted"}>●</span>
			<span className={active ? "font-bold text-foreground" : "text-subtle"}>{label}</span>
		</div>
	)
}

function progressValue(progress: GradingProgress[]): number {
	if (progress.length === 0) return 25
	return Math.min(90, 25 + progress.length * 20)
}

function criterionLabel(rubric: RubricMeta, key: string): string {
	return rubric.criteria.find((criterion) => criterion.key === key)?.label ?? key
}

function criterionMax(rubric: RubricMeta, key: string): number {
	return rubric.criteria.find((criterion) => criterion.key === key)?.max ?? rubric.max_score
}

function notAssessableDetail(display: AssessmentResultDisplay): string {
	const details = display.reason.details
	if (!isRecord(details)) return display.message

	const failedRequirements = stringList(details.failed_requirements)
	const wordCount = numberValue(details.word_count)
	const minimumWordCount = numberValue(details.minimum_word_count)
	const severeMinimumWordCount = numberValue(details.severe_minimum_word_count)

	if (failedRequirements.includes("severe_minimum_word_count") && wordCount !== null) {
		const minimumText = minimumWordCount === null ? "đủ số từ yêu cầu" : `${minimumWordCount} từ`
		if (severeMinimumWordCount === null) {
			return `Bài có ${wordCount} từ, quá ngắn so với yêu cầu ${minimumText}. Hãy viết lại đầy đủ hơn trước khi xem điểm theo tiêu chí.`
		}

		return `Bài có ${wordCount} từ, dưới ngưỡng tối thiểu để chấm tự động ${severeMinimumWordCount} từ. Hãy viết lại gần yêu cầu đầy đủ ${minimumText} trước khi xem điểm theo tiêu chí.`
	}

	if (failedRequirements.includes("task_coverage")) {
		return "Bài chưa bao phủ yêu cầu bắt buộc của đề, nên hệ thống không hiển thị điểm theo tiêu chí. Hãy viết lại với nội dung bám sát từng ý trong đề."
	}

	return display.message
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

function numberValue(value: unknown): number | null {
	return typeof value === "number" ? value : null
}

function stringList(value: unknown): string[] {
	return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : []
}

function toneBorder(tone: "danger" | "warning" | "success") {
	return {
		danger: "border-l-destructive",
		warning: "border-l-warning",
		success: "border-l-success",
	}[tone]
}

function toneBadge(tone: "danger" | "warning" | "success") {
	return {
		danger: "bg-destructive/15 text-destructive",
		warning: "bg-warning/15 text-warning",
		success: "bg-success/15 text-success",
	}[tone]
}

function StatPill({
	label,
	value,
	multiplier = 1,
	suffix = "",
	tone = "default",
}: {
	label: string
	value: number | null
	multiplier?: number
	suffix?: string
	tone?: "default" | "success" | "warning"
}) {
	const displayValue = value === null ? "—" : `${round(value * multiplier)}${suffix}`
	const valueClass = clsx(
		"text-sm font-extrabold",
		tone === "success" && "text-success",
		tone === "warning" && "text-warning",
		tone === "default" && "text-foreground",
	)

	return (
		<div className="rounded-xl bg-background px-3 py-2">
			<p className="text-[10px] font-bold uppercase text-subtle">{label}</p>
			<p className={valueClass}>{displayValue}</p>
		</div>
	)
}

function RequirementItem({
	label,
	checked,
	detail,
}: {
	label: string
	checked: boolean | null
	detail?: string
}) {
	const marker = checked === null ? "?" : checked ? "✓" : "!"
	const markerClass = checked === null ? "text-muted" : checked ? "text-success" : "text-warning"

	return (
		<div className="flex items-start gap-2 rounded-xl bg-background px-3 py-2 text-sm">
			<span className={clsx("font-extrabold", markerClass)}>{marker}</span>
			<span>
				<span className="font-bold text-foreground">{label}</span>
				{detail && <span className="block text-xs text-muted">{detail}</span>}
			</span>
		</div>
	)
}

function normalizeRewrites(rewrites: AssessmentFeedback["rewrites"]): Array<Rewrite | string> {
	return (rewrites ?? []).map((rewrite) => {
		if (typeof rewrite !== "string") return rewrite
		const match = rewrite.match(/Original:\s*(.*?)\s*→\s*Improved:\s*(.*)/i)
		if (!match) return rewrite

		return {
			original: match[1].trim(),
			improved: match[2].trim(),
		}
	})
}

function AnnotatedWritingText({ text, annotations }: { text: string; annotations: AssessmentAnnotation[] }) {
	const ranges = annotations
		.filter(
			(annotation) =>
				annotation.start >= 0 && annotation.end > annotation.start && annotation.start < text.length,
		)
		.sort((a, b) => a.start - b.start)
	const nodes: ReactNode[] = []
	let cursor = 0

	for (const annotation of ranges) {
		const start = Math.max(cursor, annotation.start)
		const end = Math.min(text.length, annotation.end)
		if (start > cursor) nodes.push(text.slice(cursor, start))
		if (end > start) {
			nodes.push(
				<span
					key={`${annotation.start}-${annotation.end}-${annotation.message}`}
					title={annotation.message}
					className="rounded-sm border-b border-destructive/60 bg-destructive/5"
				>
					{text.slice(start, end)}
				</span>,
			)
		}
		cursor = Math.max(cursor, end)
	}

	if (cursor < text.length) nodes.push(text.slice(cursor))

	return <>{nodes.length > 0 ? nodes : text}</>
}
