import { Link } from "@tanstack/react-router"
import { StaticIcon } from "#/components/Icon"
import type { ExamListItem, ExamListStatusTone } from "#/features/exam/types"

interface Props {
	exam: ExamListItem
	coinCost: number | null
}

const MIN_ATTEMPTS_POPULAR = 50

const TONE_DOT: Record<ExamListStatusTone, string> = {
	primary: "bg-primary",
	success: "bg-success",
	warning: "bg-warning",
}

const TONE_TEXT: Record<ExamListStatusTone, string> = {
	primary: "text-primary",
	success: "text-success",
	warning: "text-warning",
}

export function ExamCard({ exam, coinCost }: Props) {
	const state = exam.user_state
	const hasActive = state.status === "in_progress"
	const isPopular = exam.attempts_count !== undefined && exam.attempts_count >= MIN_ATTEMPTS_POPULAR
	const popularCount = exam.attempts_count ?? 0
	const body = (
		<>
			<div className="flex items-start justify-between gap-3">
				<h3 className="min-w-0 flex-1 font-extrabold text-base leading-tight line-clamp-2 text-foreground">
					{exam.title}
				</h3>
				{state.progress_label ? (
					<span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warning/10 px-2 py-1 text-xs">
						<span className={`inline-block size-1.5 rounded-full ${TONE_DOT[state.status_tone]}`} />
						<span className={`font-bold tabular-nums ${TONE_TEXT[state.status_tone]}`}>
							{state.progress_label}
						</span>
					</span>
				) : null}
			</div>

			<div className="flex items-center gap-1.5 text-sm text-muted">
				<StaticIcon name="timer-md" size="xs" />
				{exam.total_duration_minutes} phút
				{exam.source_school && (
					<>
						<span className="text-subtle">·</span>
						<span>{exam.source_school}</span>
					</>
				)}
			</div>

			<div className="flex flex-wrap items-center gap-2 text-xs text-muted">
				{isPopular && (
					<span className="inline-flex items-center gap-1.5">
						<span className="inline-block size-2 rounded-full bg-warning" />
						<span className="font-bold tabular-nums">{popularCount.toLocaleString("vi-VN")}</span> người đã
						làm
					</span>
				)}
				{exam.tags.map((tag) => (
					<span key={tag} className="rounded-full bg-background px-2 py-0.5 font-bold text-subtle">
						{tag}
					</span>
				))}
			</div>

			<div className="flex items-center justify-between gap-3 pt-1">
				<div className="flex items-center gap-2 text-sm">
					<span className={`inline-block size-2 rounded-full ${TONE_DOT[state.status_tone]}`} />
					<span className={hasActive ? `font-bold ${TONE_TEXT[state.status_tone]}` : "text-muted"}>
						{state.status_label}
					</span>
				</div>

				<div className="flex items-center gap-2">
					{coinCost !== null && !hasActive && (
						<span className="inline-flex items-center gap-1" title="Giá một lượt làm">
							<StaticIcon name="coin" size="sm" />
							<span className="text-sm font-extrabold text-coin-dark tabular-nums">{coinCost}</span>
						</span>
					)}
					<Link
						to="/thi-thu/$examId"
						params={{ examId: exam.id }}
						className="btn btn-secondary text-sm py-2 px-3"
					>
						Chi tiết
					</Link>
					{hasActive ? (
						<Link
							to="/phong-thi/$sessionId"
							params={{ sessionId: state.active_session_id }}
							className="btn btn-primary text-sm py-2 px-4"
						>
							Tiếp tục
						</Link>
					) : (
						<Link
							to="/thi-thu/$examId"
							params={{ examId: exam.id }}
							className="btn btn-primary text-sm py-2 px-4"
						>
							{state.primary_action_label}
						</Link>
					)}
				</div>
			</div>
		</>
	)

	const cardClass = "card-interactive flex flex-col gap-2.5 p-4"

	return <div className={cardClass}>{body}</div>
}
