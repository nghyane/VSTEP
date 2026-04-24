import { Link } from "@tanstack/react-router"
import { Icon, StaticIcon } from "#/components/Icon"
import { SkillChip } from "#/components/SkillChip"
import type { Exam, SkillKey } from "#/features/exam/types"

export type ExamStatus = "not-started" | "in-progress" | "submitted"

interface Props {
	exam: Exam
	fullTestCoinCost: number | null
	status?: ExamStatus
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

export function ExamCard({ exam, fullTestCoinCost, status = "not-started" }: Props) {
	return (
		<div className="card p-5 flex flex-col gap-4 hover:border-primary/40 hover:-translate-y-0.5 transition-all">
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
				<StatusBadge status={status} />

				<div className="flex items-center gap-2">
					{fullTestCoinCost !== null && (
						<span className="inline-flex items-center gap-1.5 px-1" title="Giá một lượt làm">
							<StaticIcon name="coin" size="sm" />
							<span className="text-sm font-extrabold text-coin-dark tabular-nums">{fullTestCoinCost}</span>
						</span>
					)}
					<Link
						to="/thi-thu/$examId"
						params={{ examId: exam.id }}
						className="btn btn-primary text-sm py-2 px-4"
					>
						Xem đề
					</Link>
				</div>
			</div>
		</div>
	)
}
