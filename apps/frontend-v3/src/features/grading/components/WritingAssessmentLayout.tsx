import { Link } from "@tanstack/react-router"
import { DuoProgressBar } from "#/components/DuoProgressBar"
import { FeedbackSection, RewriteSection } from "#/features/grading/components/FeedbackSection"
import { RubricBar } from "#/features/grading/components/RubricBar"
import type {
	AssessmentFeedback,
	GradingProgress,
	Improvement,
	RubricMeta,
	WritingGradingResult,
} from "#/features/grading/types"
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
	onRequest: () => void
}

export interface WritingAssessmentView {
	result: WritingGradingResult
	rubric: RubricMeta | null
	context: WritingAssessmentContext | null
	feedback: WritingFeedbackAction
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
				<ScoreSummary view={view} />
				<ContextCard context={view.context} />
			</aside>
			<section className="space-y-4">
				<RubricPanel view={view} />
				<FeedbackPanel view={view} />
				<RewritePanel result={view.result} />
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
					<p className="font-bold text-lg text-foreground">AI đang chấm bài...</p>
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

function ScoreSummary({ view }: LayoutProps) {
	return (
		<div className="card p-6 text-center">
			<p className="text-xs font-bold uppercase tracking-wide text-subtle mb-1">Điểm tổng</p>
			<p className="text-6xl font-extrabold tabular-nums text-skill-writing">
				{round(view.result.overall_band)}
			</p>
			<p className="text-sm text-subtle mt-1">/ {view.rubric?.max_score ?? 10}</p>
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

function RubricPanel({ view }: LayoutProps) {
	return (
		<div className="card p-6 space-y-3">
			<p className="text-xs font-bold uppercase tracking-wide text-subtle">Rubric</p>
			{view.result.criterion_scores.map((criterion) => (
				<RubricBar
					key={criterion.key}
					label={criterionLabel(view.rubric, criterion.key)}
					score={criterion.score}
					max={criterionMax(view.rubric, criterion.key)}
					color={COLOR}
				/>
			))}
		</div>
	)
}

function FeedbackPanel({ view }: LayoutProps) {
	return (
		<div className="card p-6 space-y-4">
			<FeedbackSection
				strengths={view.result.feedback?.strengths ?? []}
				improvements={feedbackImprovements(view.result.feedback)}
			/>
			<AIFeedbackButton action={view.feedback} />
		</div>
	)
}

function AIFeedbackButton({ action }: { action: WritingFeedbackAction }) {
	if (!action.canRequest) return null

	return (
		<div className="border-t-2 border-border pt-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-xs text-subtle">
					{action.requested ? "Đã yêu cầu nhận xét AI cho bài này." : `Tốn ${action.cost} xu.`}
				</p>
				<button
					type="button"
					onClick={action.onRequest}
					disabled={action.pending || action.requested}
					className="btn btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
				>
					{action.pending ? "Đang xử lý..." : action.requested ? "Đã yêu cầu" : "Nhận xét từ AI"}
				</button>
			</div>
			{action.error && <p className="mt-2 text-xs font-bold text-destructive">{action.error}</p>}
		</div>
	)
}

function feedbackImprovements(feedback: AssessmentFeedback | null): Array<Improvement | string> {
	const improvements = feedback?.improvements ?? []
	if (improvements.length > 0) return improvements

	const evidenceNotes = feedback?.evidenceNotes
	if (!evidenceNotes) return []
	if (Array.isArray(evidenceNotes)) return evidenceNotes

	return Object.values(evidenceNotes).map((entry) => ({
		message: entry.label,
		explanation: entry.detail,
	}))
}

function RewritePanel({ result }: { result: WritingGradingResult }) {
	const rewrites = result.feedback?.rewrites ?? []
	if (rewrites.length === 0) return null

	return (
		<div className="card p-6">
			<RewriteSection rewrites={rewrites} />
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

function criterionLabel(rubric: RubricMeta | null, key: string): string {
	return rubric?.criteria.find((criterion) => criterion.key === key)?.label ?? key
}

function criterionMax(rubric: RubricMeta | null, key: string): number {
	return rubric?.criteria.find((criterion) => criterion.key === key)?.max ?? rubric?.max_score ?? 10
}
