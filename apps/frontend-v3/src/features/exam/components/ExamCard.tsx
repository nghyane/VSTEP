import { Link } from "@tanstack/react-router"
import { Icon, StaticIcon } from "#/components/Icon"
import type { Exam } from "#/features/exam/types"
import { cn } from "#/lib/utils"

interface Props {
	exam: Exam
	fullTestCoinCost: number | null
}

const SKILL_COLORS: Record<string, string> = {
	listening: "text-skill-listening",
	reading: "text-skill-reading",
	writing: "text-skill-writing",
	speaking: "text-skill-speaking",
}

const SKILL_LABELS: Record<string, string> = {
	listening: "Listening",
	reading: "Reading",
	writing: "Writing",
	speaking: "Speaking",
}

const SKILL_ORDER = ["listening", "reading", "writing", "speaking"] as const

export function ExamCard({ exam, fullTestCoinCost }: Props) {
	return (
		<div className="card p-5 flex flex-col gap-4">
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
			<div className="flex flex-wrap gap-x-3 gap-y-1">
				{SKILL_ORDER.map((skill) => (
					<span key={skill} className={cn("text-xs font-semibold", SKILL_COLORS[skill])}>
						{SKILL_LABELS[skill]}
					</span>
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
			<div className="flex items-center justify-between pt-2 border-t border-border-light">
				<span className="text-xs text-subtle">Chưa làm</span>

				<div className="flex items-center gap-3">
					{fullTestCoinCost !== null && (
						<span className="flex items-center gap-1">
							<StaticIcon name="gem-color" size="xs" />
							<span className="text-xs font-bold text-coin-dark">{fullTestCoinCost}</span>
						</span>
					)}
					<Link
						to="/thi-thu/$examId"
						params={{ examId: exam.id }}
						className="btn btn-primary text-xs py-2 px-4"
					>
						Xem đề
					</Link>
				</div>
			</div>
		</div>
	)
}
