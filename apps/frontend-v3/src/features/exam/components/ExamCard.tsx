import { Link } from "@tanstack/react-router"
import { Icon, StaticIcon } from "#/components/Icon"
import { SkillChip } from "#/components/SkillChip"
import type { Exam, SkillKey } from "#/features/exam/types"
import { useExamTimer } from "#/features/exam/use-exam-session"
import { formatCompact } from "#/lib/utils"

export type ExamStatus = "not-started" | "in-progress" | "submitted"

export interface ActiveSummary {
	sessionId: string
	deadlineAt: string
	isFullTest: boolean
	selectedSkills: SkillKey[]
}

interface Props {
	exam: Exam
	fullTestCoinCost: number | null
	status?: ExamStatus
	active?: ActiveSummary
}

function formatRemaining(seconds: number): string {
	const h = Math.floor(seconds / 3600)
	const m = Math.floor((seconds % 3600) / 60)
	const s = seconds % 60
	if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}p`
	return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

function ResumeCountdown({ deadlineAt }: { deadlineAt: string }) {
	const remaining = useExamTimer(deadlineAt)
	if (remaining <= 0) return null
	return (
		<span className="inline-flex items-center gap-1 text-xs text-warning font-bold tabular-nums">
			<Icon name="timer" size="xs" />
			{formatRemaining(remaining)}
		</span>
	)
}

const SKILL_ORDER: SkillKey[] = ["listening", "reading", "writing", "speaking"]

function StatusBadge({ status }: { status: ExamStatus }) {
	if (status === "in-progress") {
		return (
			<span className="inline-flex items-center gap-1.5 rounded-full border-2 border-b-4 border-warning/40 bg-warning-tint px-2.5 py-0.5 text-xs font-extrabold text-warning">
				<span className="relative flex size-2">
					<span className="absolute inline-flex size-full animate-ping rounded-full bg-warning opacity-60" />
					<span className="relative inline-flex size-2 rounded-full bg-warning" />
				</span>
				Đang làm dở
			</span>
		)
	}
	if (status === "submitted") {
		return (
			<span className="inline-flex items-center gap-1.5 rounded-full border-2 border-b-4 border-primary/40 bg-primary-tint px-2.5 py-0.5 text-xs font-extrabold text-primary">
				<Icon name="check" size="xs" className="text-primary" />
				Đã nộp
			</span>
		)
	}
	return (
		<span className="inline-flex items-center gap-1.5 rounded-full bg-background border-2 border-border px-2.5 py-0.5 text-xs font-bold text-subtle">
			Chưa làm
		</span>
	)
}

export function ExamCard({ exam, fullTestCoinCost, status = "not-started", active }: Props) {
	return (
		<div className="card-interactive p-5 flex flex-col gap-4 cursor-default">
			{/* Title + meta */}
			<div className="space-y-1.5">
				<p className="font-bold text-base leading-tight text-foreground">{exam.title}</p>

				<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
					<span className="flex items-center gap-1.5">
						<StaticIcon name="timer-md" size="xs" />
						{exam.total_duration_minutes} phút
					</span>
					{exam.source_school && (
						<span className="flex items-center gap-1.5">
							<Icon name="graduation" size="xs" className="text-subtle" />
							{exam.source_school}
						</span>
					)}
					{exam.attempts_count !== undefined && (
						<span
							className="flex items-center gap-1.5"
							title={`${exam.attempts_count.toLocaleString("vi-VN")} lượt thi`}
						>
							<StaticIcon name="avatar-nodding" size="sm" className="h-5 w-auto" />
							<span className="font-bold tabular-nums">{formatCompact(exam.attempts_count)}</span> lượt thi
						</span>
					)}
				</div>
			</div>

			{/* Skills */}
			<div className="flex flex-wrap gap-1.5">
				{SKILL_ORDER.map((skill) => (
					<SkillChip key={skill} skill={skill} size="sm" />
				))}
			</div>

			{/* Tags */}
			{exam.tags.length > 0 && (
				<div className="flex flex-wrap gap-1.5">
					{exam.tags.map((tag) => (
						<span
							key={tag}
							className="inline-flex items-center rounded-full bg-background border-2 border-border px-2.5 py-0.5 text-xs font-medium text-subtle"
						>
							{tag}
						</span>
					))}
				</div>
			)}

			{/* Footer: status + coin + CTA */}
			<div className="flex items-center justify-between pt-3 border-t border-border-light mt-auto">
				<div className="flex items-center gap-2">
					<StatusBadge status={status} />
					{active && <ResumeCountdown deadlineAt={active.deadlineAt} />}
				</div>

				<div className="flex items-center gap-2">
					{fullTestCoinCost !== null && !active && (
						<span className="inline-flex items-center gap-1.5 px-1" title="Giá một lượt làm">
							<StaticIcon name="coin" size="sm" />
							<span className="text-sm font-extrabold text-coin-dark tabular-nums">{fullTestCoinCost}</span>
						</span>
					)}
					{active ? (
						<Link
							to="/phong-thi/$sessionId"
							params={{ sessionId: active.sessionId }}
							search={{ examId: exam.id }}
							className="btn btn-primary text-sm py-2 px-4"
						>
							Làm tiếp
							<Icon name="lightning" size="xs" className="text-white" />
						</Link>
					) : (
						<Link
							to="/thi-thu/$examId"
							params={{ examId: exam.id }}
							className="btn btn-primary text-sm py-2 px-4"
						>
							Xem đề
						</Link>
					)}
				</div>
			</div>
		</div>
	)
}
