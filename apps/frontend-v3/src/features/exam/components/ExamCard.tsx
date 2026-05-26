import { Link } from "@tanstack/react-router"
import { StaticIcon } from "#/components/Icon"
import type { Exam, SkillKey } from "#/features/exam/types"
import { round } from "#/lib/utils"

export type ExamStatus = "not-started" | "in-progress" | "submitted"

export type ExamCardState =
	| { status: "not-started" }
	| { status: "in-progress"; sessionId: string; selectedSkills: SkillKey[] }
	| {
			status: "submitted"
			latestScore: number | null
			sessionCount: number
	  }

interface Props {
	exam: Exam
	coinCost: number | null
	state: ExamCardState
}

const MIN_ATTEMPTS_POPULAR = 50

function vstepLevel(band: number): string {
	if (band >= 8.5) return "C1"
	if (band >= 6.0) return "B2"
	if (band >= 4.0) return "B1"
	if (band >= 3.5) return "A2"
	return "A1"
}

function ScoreBadge({ score }: { score: number }) {
	return (
		<span className="inline-flex items-center gap-1.5 text-sm shrink-0">
			<span className="inline-block size-2 rounded-full bg-primary" />
			<span className="font-extrabold text-primary tabular-nums">{round(score)}</span>
			<span className="font-bold text-primary/60 text-xs">{vstepLevel(score)}</span>
		</span>
	)
}

export function ExamCard({ exam, coinCost, state }: Props) {
	const hasActive = state.status === "in-progress"
	const hasSubmitted = state.status === "submitted"
	const isPopular = exam.attempts_count !== undefined && exam.attempts_count >= MIN_ATTEMPTS_POPULAR
	const popularCount = exam.attempts_count ?? 0

	return (
		<div className="card p-5 flex flex-col gap-3">
			{/* Row 1: title + top-right info */}
			<div className="flex items-start justify-between gap-3">
				<h3 className="font-extrabold text-base leading-tight line-clamp-2 text-foreground flex-1 min-w-0">
					{exam.title}
				</h3>
				<div className="shrink-0">
					{hasSubmitted && state.latestScore !== null ? (
						<ScoreBadge score={state.latestScore} />
					) : hasActive ? (
						<span className="inline-flex items-center gap-1 text-xs">
							<span className="inline-block size-1.5 rounded-full bg-warning" />
							<span className="font-bold text-warning tabular-nums">{state.selectedSkills.length}/4</span>
							<span className="text-subtle">kỹ năng</span>
						</span>
					) : null}
				</div>
			</div>

			{/* Row 2: duration · source */}
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

			{/* Row 3: popular badge */}
			{isPopular && (
				<div className="flex items-center gap-1.5 text-xs text-muted">
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0">
						<path
							d="M7 1C5.5 3.5 2 4.5 2 7.5C2 10.5 4.5 13 7 13C9.5 13 12 10.5 12 7.5C12 4.5 8.5 3.5 7 1Z"
							fill="currentColor"
							className="text-warning"
						/>
					</svg>
					<span className="font-bold tabular-nums">{popularCount.toLocaleString("vi-VN")}</span> người đã làm
				</div>
			)}

			{/* Row 4: tags */}
			{exam.tags.length > 0 && (
				<div className="flex items-center gap-1.5 text-xs text-muted">
					{exam.tags.map((tag, i) => (
						<span key={tag}>
							{tag}
							{i < exam.tags.length - 1 && <span className="text-subtle"> · </span>}
						</span>
					))}
				</div>
			)}

			{/* Row 5: status + CTA */}
			<div className="flex items-center justify-between">
				{hasActive ? (
					<div className="flex items-center gap-2 text-sm">
						<span className="inline-block size-2 rounded-full bg-warning" />
						<span className="font-bold text-warning">Đang làm</span>
					</div>
				) : hasSubmitted ? (
					<div className="flex items-center gap-2 text-sm">
						<span className="inline-block size-2 rounded-full bg-primary" />
						<span className="text-muted">Đã làm {state.sessionCount} lần</span>
					</div>
				) : (
					<div className="flex items-center gap-2 text-sm">
						<span className="inline-block size-2 rounded-full bg-success" />
						<span className="text-muted">Chưa bắt đầu</span>
					</div>
				)}

				<div className="flex items-center gap-3 ml-auto">
					{coinCost !== null && !hasActive && (
						<span className="inline-flex items-center gap-1" title="Giá một lượt làm">
							<StaticIcon name="coin" size="sm" />
							<span className="text-sm font-extrabold text-coin-dark tabular-nums">{coinCost}</span>
						</span>
					)}
					{hasActive ? (
						<Link
							to="/phong-thi/$sessionId"
							params={{ sessionId: state.sessionId }}
							search={{ examId: exam.id }}
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
							{hasSubmitted ? "Làm lại" : "Bắt đầu"}
						</Link>
					)}
				</div>
			</div>
		</div>
	)
}
