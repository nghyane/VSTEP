import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type ReactNode, useEffect, useMemo, useState } from "react"
import { CoinSpendFly, useCoinSpendFly } from "#/components/CoinSpendFly"
import { StaticIcon } from "#/components/Icon"
import { ScrollArea } from "#/components/ScrollArea"
import {
	AnnotatedText,
	ProductiveDiagnosticsPanel,
} from "#/features/exam/components/result/ProductiveDiagnosticsPanel"
import { ProductiveFeedbackPanel } from "#/features/exam/components/result/ProductiveFeedbackPanel"
import {
	buildProductiveItems,
	type ProductiveItem,
	type ProductiveKind,
} from "#/features/exam/components/result/productive-model"
import type { SessionResultsData } from "#/features/exam/types"
import { RubricBar } from "#/features/grading/components/RubricBar"
import { requestTeacherGrading } from "#/features/grading/queries"
import type {
	AssessmentResultDisplay,
	CriterionScore,
	TeacherGradingRequestResponse,
	TeacherGradingRequestState,
} from "#/features/grading/types"
import { cn, round } from "#/lib/utils"
import { scoreLabel, statusLabel } from "./helpers"

interface Props {
	readonly result: SessionResultsData
	readonly kind: ProductiveKind
}

const WRITING_LABEL: Record<string, string> = {
	task_fulfillment: "Task Fulfillment",
	organization: "Organization",
	vocabulary: "Vocabulary",
	grammar: "Grammar",
}

const SPEAKING_LABEL: Record<string, string> = {
	fluency: "Fluency",
	pronunciation: "Pronunciation",
	discourse_management: "Discourse Management",
	vocabulary: "Vocabulary",
	grammar: "Grammar",
}

export function ProductiveSkillReview({ result, kind }: Props) {
	const items = useMemo(() => buildProductiveItems(result, kind), [result, kind])
	const [activeId, setActiveId] = useState(items[0]?.id ?? "")

	useEffect(() => {
		setActiveId((current) => {
			if (items.some((item) => item.id === current)) return current
			return items[0]?.id ?? ""
		})
	}, [items])

	const active = items.find((item) => item.id === activeId) ?? items[0]
	if (!active)
		return <EmptyState text={kind === "writing" ? "Không có phần Writing." : "Không có phần Speaking."} />

	const title = kind === "writing" ? "Writing" : "Speaking"
	const labels = kind === "writing" ? WRITING_LABEL : SPEAKING_LABEL
	const color = kind === "writing" ? "var(--color-skill-writing)" : "var(--color-skill-speaking)"
	const scoreColor =
		kind === "writing" ? "var(--color-skill-writing-dark)" : "var(--color-skill-speaking-dark)"
	const showScore = (active.display?.ui.show_score ?? true) && active.display?.status !== "not_assessable"

	return (
		<div className="flex h-full min-h-0 flex-col bg-surface">
			<header className="shrink-0 border-b-2 border-border-light bg-surface px-4 py-4">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div>
						<p className="text-xs font-black uppercase tracking-[0.16em] text-muted">Kết quả</p>
						<h2 className="mt-1 text-xl font-black text-foreground">
							{title} · {active.label}
						</h2>
						<p className="mt-1 text-sm font-bold text-muted">
							{active.display?.status_label ?? statusLabel(active.status)}
						</p>
					</div>
					<p
						className="text-3xl font-black tabular-nums"
						style={{ color: showScore && active.score !== null ? scoreColor : undefined }}
					>
						{productiveScoreLabel(active)}
					</p>
				</div>

				<ItemTabs
					items={items}
					activeId={active.id}
					color={color}
					scoreColor={scoreColor}
					onSelect={setActiveId}
				/>
			</header>

			<ScrollArea className="min-h-0 flex-1 bg-surface">
				<div className="space-y-4 p-4">
					<PaperBlock item={active} />
					<NotAssessableBlock item={active} />
					<ProductiveDiagnosticsPanel item={active} kind={kind} />
					<RubricBlock
						scores={active.criteria}
						labels={labels}
						color={color}
						show={active.display?.ui.show_criterion_breakdown ?? true}
					/>
					<ProductiveFeedbackPanel item={active} />
					<TeacherGradingSection item={active} kind={kind} sessionId={result.session.id} />
				</div>
			</ScrollArea>
		</div>
	)
}

function ItemTabs({
	items,
	activeId,
	color,
	scoreColor,
	onSelect,
}: {
	readonly items: readonly ProductiveItem[]
	readonly activeId: string
	readonly color: string
	readonly scoreColor: string
	readonly onSelect: (id: string) => void
}) {
	if (items.length <= 1) return null

	return (
		<div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
			{items.map((item) => (
				<button
					key={item.id}
					type="button"
					onClick={() => onSelect(item.id)}
					style={activeId === item.id ? { borderColor: color } : undefined}
					className={cn(
						"flex min-w-[9rem] items-center justify-between gap-2 rounded-full border-2 px-3 py-2 text-left text-sm font-black transition-colors",
						activeId === item.id
							? "bg-background text-foreground"
							: "border-border bg-background text-subtle hover:text-foreground",
					)}
				>
					<span>{item.label}</span>
					<span
						className="text-xs tabular-nums"
						style={{
							color:
								item.display?.status === "not_assessable" || item.score === null ? undefined : scoreColor,
						}}
					>
						{productiveScoreLabel(item)}
					</span>
					{activeId === item.id && <span className="sr-only">Đang chọn</span>}
				</button>
			))}
		</div>
	)
}

function PaperBlock({ item }: { readonly item: ProductiveItem }) {
	return (
		<section className="space-y-3">
			<p className="text-xs font-black uppercase tracking-[0.14em] text-muted">{item.responseLabel}</p>
			<div className="space-y-3">
				{item.wordCount !== undefined && (
					<p className="text-xs font-bold text-muted">
						Số từ: <span className="font-black text-foreground tabular-nums">{item.wordCount}</span>
					</p>
				)}
				{item.audioUrl && (
					<audio src={item.audioUrl} controls className="w-full">
						<track kind="captions" />
					</audio>
				)}
				{item.response ? (
					<p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
						<AnnotatedText text={item.response} annotations={item.diagnostics?.annotations ?? []} />
					</p>
				) : (
					<p className="text-sm font-bold text-muted">Chưa có nội dung bài làm.</p>
				)}
				<details className="rounded-2xl border-2 border-border bg-background/40">
					<summary className="cursor-pointer px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-subtle hover:text-foreground">
						Đề bài
					</summary>
					<p className="whitespace-pre-wrap px-4 pb-4 text-sm leading-7 text-foreground">{item.prompt}</p>
				</details>
			</div>
		</section>
	)
}

function NotAssessableBlock({ item }: { readonly item: ProductiveItem }) {
	const display = item.display
	if (display?.status !== "not_assessable") return null

	return (
		<section className="rounded-(--radius-card) border-2 border-destructive/35 bg-destructive/5 p-4">
			<p className="text-xs font-black uppercase tracking-[0.14em] text-destructive">
				Không chấm điểm rubric
			</p>
			<p className="mt-2 text-sm font-black text-foreground">
				{display.reason.label ?? display.status_label}
			</p>
			<p className="mt-1 text-sm leading-6 text-muted">{notAssessableDetail(display, item.label)}</p>
		</section>
	)
}

function RubricBlock({
	scores,
	labels,
	color,
	show,
}: {
	readonly scores: readonly CriterionScore[] | null
	readonly labels: Record<string, string>
	readonly color: string
	readonly show: boolean
}) {
	if (!show) return null
	if (!scores || scores.length === 0) return null

	return (
		<Section title="Điểm theo tiêu chí">
			<div className="grid gap-3 sm:grid-cols-2">
				{scores.map((criterion) => (
					<div key={criterion.key} className="rounded-2xl bg-background/50 p-3">
						<RubricBar
							label={labels[criterion.key] ?? criterion.key}
							score={round(criterion.score)}
							max={10}
							color={color}
						/>
					</div>
				))}
			</div>
		</Section>
	)
}

function productiveScoreLabel(item: ProductiveItem): string {
	if (item.display?.status === "not_assessable") return "Cần viết lại"

	return scoreLabel(item.score)
}

function notAssessableDetail(display: AssessmentResultDisplay, label: string): string {
	const details = display.reason.details
	if (!isRecord(details)) return display.message

	const failedRequirements = stringList(details.failed_requirements)
	const wordCount = numberValue(details.word_count)
	const minimumWordCount = numberValue(details.minimum_word_count)
	const severeMinimumWordCount = numberValue(details.severe_minimum_word_count)

	if (failedRequirements.includes("severe_minimum_word_count") && wordCount !== null) {
		const minimumText = minimumWordCount === null ? "đủ số từ yêu cầu" : `${minimumWordCount} từ`
		if (severeMinimumWordCount === null) {
			return `${label} có ${wordCount} từ, quá ngắn so với yêu cầu ${minimumText}. Hãy viết lại đầy đủ hơn trước khi xem điểm theo tiêu chí.`
		}

		return `${label} có ${wordCount} từ, dưới ngưỡng tối thiểu để chấm tự động ${severeMinimumWordCount} từ. Hãy viết lại gần yêu cầu đầy đủ ${minimumText} trước khi xem điểm theo tiêu chí.`
	}

	if (failedRequirements.includes("task_coverage")) {
		return `${label} chưa bao phủ yêu cầu bắt buộc của đề, nên hệ thống không hiển thị điểm theo tiêu chí. Hãy viết lại với nội dung bám sát từng ý trong đề.`
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

function Section({ title, children }: { readonly title: string; readonly children: ReactNode }) {
	return (
		<section className="rounded-(--radius-card) border-2 border-border bg-surface p-4">
			<p className="text-xs font-black uppercase tracking-[0.14em] text-muted">{title}</p>
			<div className="mt-3">{children}</div>
		</section>
	)
}

function EmptyState({ text }: { readonly text: string }) {
	return (
		<div className="flex h-full items-center justify-center px-4 text-center text-sm font-bold text-muted">
			{text}
		</div>
	)
}

function TeacherGradingSection({
	item,
	kind,
	sessionId,
}: {
	readonly item: ProductiveItem
	readonly kind: ProductiveKind
	readonly sessionId: string
}) {
	const queryClient = useQueryClient()
	const { showCoinFly, triggerCoinSpendFly } = useCoinSpendFly()
	const tgr = item.teacherGradingRequest
	const attemptId = item.attemptId

	const requestMutation = useMutation({
		mutationFn: () => {
			if (!attemptId) throw new Error("No attempt")
			return requestTeacherGrading(attemptId)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["exam-sessions", sessionId, "results"] })
			queryClient.invalidateQueries({ queryKey: ["wallet"] })
		},
	})

	if (!tgr || !attemptId) return null
	const state = teacherGradingStateAfterRequest(tgr, requestMutation.data?.data, attemptId)
	const responseLabel = kind === "writing" ? "bài viết" : "bài nói"
	const handleRequest = () => {
		if (state.cost_coins > 0) triggerCoinSpendFly()
		requestMutation.mutate()
	}

	if (state.requested) {
		return (
			<Section title="Giáo viên chấm">
				<div className="space-y-2">
					<TeacherGradingStatus tgr={state} />
					{state.status !== "completed" && (
						<p className="text-xs text-subtle">Đã thanh toán {state.cost_coins} xu.</p>
					)}
				</div>
			</Section>
		)
	}

	return (
		<Section title="Giáo viên chấm">
			{state.can_request ? (
				<div>
					<p className="text-sm text-muted">
						Bạn có thể yêu cầu giáo viên chấm lại {responseLabel} này để có đánh giá chuyên sâu hơn.
					</p>
					<div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-xs text-subtle">
							<span className="inline-flex items-center gap-1.5">
								<StaticIcon name="coin" size="xs" className="h-3.5 w-auto -translate-y-0.5" />{" "}
								{state.cost_coins} xu
							</span>
						</p>
						<div className="relative inline-flex self-start sm:self-auto">
							{showCoinFly && <CoinSpendFly cost={state.cost_coins} />}
							<button
								type="button"
								disabled={requestMutation.isPending}
								onClick={handleRequest}
								className="btn btn-primary"
							>
								{requestMutation.isPending ? "Đang gửi..." : "Yêu cầu giáo viên chấm"}
							</button>
						</div>
					</div>
					{requestMutation.isError && (
						<p className="mt-2 text-sm font-bold text-destructive">
							{errorMessage(requestMutation.error) ?? "Không gửi được yêu cầu."}
						</p>
					)}
				</div>
			) : (
				<p className="text-sm text-muted">
					Bài cần được chấm điểm tự động trước khi có thể yêu cầu giáo viên chấm.
				</p>
			)}
		</Section>
	)
}

function teacherGradingStateAfterRequest(
	state: TeacherGradingRequestState,
	response: TeacherGradingRequestResponse | undefined,
	attemptId: string,
): TeacherGradingRequestState {
	if (!response) return state
	if (response.attempt && response.attempt.id !== attemptId) return state

	return {
		...state,
		requested: true,
		request_id: response.id,
		status: response.status,
		cost_coins: response.cost_coins ?? state.cost_coins,
		assigned_teacher: response.assigned_teacher ?? state.assigned_teacher,
		requested_at: response.requested_at ?? state.requested_at,
		assigned_at: response.assigned_at ?? state.assigned_at,
		completed_at: response.completed_at ?? state.completed_at,
		teacher_result: response.teacher_result ?? state.teacher_result,
	}
}

function errorMessage(error: unknown): string | null {
	return error instanceof Error ? error.message : null
}

function TeacherGradingStatus({ tgr }: { readonly tgr: TeacherGradingRequestState }) {
	const status = tgr.status

	if (status === "pending_assignment") {
		return (
			<div className="rounded-2xl bg-warning/5 p-3">
				<p className="text-sm font-bold text-warning">Đang chờ phân công giáo viên</p>
				<p className="mt-1 text-xs text-muted">
					Yêu cầu của bạn đã được ghi nhận. Đội ngũ sẽ phân công giáo viên trong thời gian sớm nhất.
				</p>
			</div>
		)
	}

	if (status === "assigned" || status === "in_progress") {
		const teacherName = tgr.assigned_teacher?.full_name ?? "giáo viên"
		return (
			<div className="rounded-2xl bg-info/5 p-3">
				<p className="text-sm font-bold text-info-dark">
					{status === "assigned" ? "Đã phân công giáo viên" : "Giáo viên đang chấm"}
				</p>
				<p className="mt-1 text-xs text-muted">
					{teacherName}{" "}
					{status === "assigned" ? "sẽ sớm bắt đầu chấm bài của bạn." : "đang xem xét bài làm của bạn."}
				</p>
			</div>
		)
	}

	if (status === "completed" && tgr.teacher_result) {
		const result = tgr.teacher_result
		return (
			<div className="space-y-3">
				<div className="rounded-2xl bg-primary/5 p-3">
					<p className="text-sm font-bold text-primary-dark">Giáo viên đã chấm xong</p>
					<p className="mt-1 text-xs text-muted">Kết quả bên dưới là đánh giá từ giáo viên.</p>
				</div>
				<div className="flex items-center gap-3">
					<span className="text-xs font-black uppercase tracking-[0.14em] text-muted">Điểm giáo viên</span>
					<span className="text-2xl font-black tabular-nums text-primary-dark">
						{scoreLabel(result.overall_band)}
					</span>
				</div>
				{result.criterion_scores.length > 0 && (
					<div className="grid gap-2 sm:grid-cols-2">
						{result.criterion_scores.map((criterion) => (
							<div key={criterion.key} className="rounded-2xl bg-background/50 p-3">
								<RubricBar
									label={criterion.key}
									score={round(criterion.score)}
									max={10}
									color="var(--color-primary-dark)"
								/>
							</div>
						))}
					</div>
				)}
				{result.feedback && (
					<ProductiveFeedbackPanel item={{ ...itemPlaceholder, feedback: result.feedback }} />
				)}
			</div>
		)
	}

	if (status === "rejected" || status === "cancelled") {
		return (
			<div className="rounded-2xl bg-destructive/5 p-3">
				<p className="text-sm font-bold text-destructive">
					{status === "rejected" ? "Yêu cầu bị từ chối" : "Yêu cầu đã hủy"}
				</p>
				<p className="mt-1 text-xs text-muted">
					{status === "rejected"
						? "Rất tiếc, yêu cầu chấm bài của bạn không được chấp nhận. Vui lòng thử lại hoặc liên hệ hỗ trợ."
						: "Yêu cầu chấm bài đã bị hủy. Bạn có thể gửi yêu cầu mới."}
				</p>
			</div>
		)
	}

	return null
}

// Placeholder item for reusing ProductiveFeedbackPanel for teacher result.
// Only the `feedback` field matters for rendering; other fields exist only to
// satisfy the ProductiveItem type so the feedback panel can render safely.
const itemPlaceholder: ProductiveItem = {
	id: "",
	label: "",
	prompt: "",
	responseLabel: "",
	response: null,
	score: null,
	status: "ready",
	criteria: null,
	display: null,
	diagnostics: null,
	scoreInsights: [],
	feedback: null,
	attemptId: null,
	teacherGradingRequest: null,
}
