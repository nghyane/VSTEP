import { Clock, Crown, Users } from "lucide-react"
import type { ExamDetail } from "#/lib/mock/thi-thu"
import { cn } from "#/lib/utils"

interface Props {
	exam: ExamDetail
}

const SKILL_CHIP: Record<
	string,
	{ chipClass: string; textClass: string; label: string; shortLabel: string }
> = {
	listening: {
		chipClass: "bg-skill-listening/10",
		textClass: "text-skill-listening",
		label: "Listening",
		shortLabel: "Nghe",
	},
	reading: {
		chipClass: "bg-skill-reading/10",
		textClass: "text-skill-reading",
		label: "Reading",
		shortLabel: "Đọc",
	},
	writing: {
		chipClass: "bg-skill-writing/10",
		textClass: "text-skill-writing",
		label: "Writing",
		shortLabel: "Viết",
	},
	speaking: {
		chipClass: "bg-skill-speaking/10",
		textClass: "text-skill-speaking",
		label: "Speaking",
		shortLabel: "Nói",
	},
}

const SKILLS = ["listening", "reading", "writing", "speaking"] as const

export function ExamDetailHeader({ exam }: Props) {
	const skillStats = SKILLS.map((skill) => {
		const skillSections = exam.sections.filter((s) => s.skill === skill)
		const minutes = skillSections.reduce((sum, s) => sum + s.durationMinutes, 0)
		const count = skillSections.reduce((sum, s) => sum + s.questionCount, 0)
		const unit = skillSections[0]?.unit ?? "câu"
		return { skill, minutes, count, unit }
	})

	return (
		<div className="space-y-4">
			{/* Title row */}
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					{exam.isPro ? (
						<span className="inline-flex items-end gap-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-2.5 py-0.5 text-white shadow-sm">
							<Crown className="mb-px size-3 shrink-0" />
							<span className="text-[10px] font-bold leading-none uppercase tracking-wider">
								Pro
							</span>
						</span>
					) : (
						<span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
							Free
						</span>
					)}
					{exam.tags.map((tag) => (
						<span
							key={tag}
							className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
						>
							{tag}
						</span>
					))}
				</div>

				<h1 className="text-2xl font-bold leading-tight">{exam.title}</h1>
			</div>

			{/* Meta row */}
			<div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
				<span className="flex items-center gap-1.5">
					<Clock className="size-4" />
					{exam.totalDurationMinutes} phút
				</span>
				<span className="flex items-center gap-1.5">
					<Users className="size-4" />
					{exam.attemptCount.toLocaleString("vi-VN")} lượt thi
				</span>
				{exam.lastAttempt && (
					<span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
						Lần cuối: {exam.lastAttempt.score} · {exam.lastAttempt.date}
					</span>
				)}
			</div>

			{/* Skill chips */}
			<div className="flex flex-wrap gap-2">
				{SKILLS.map((skill) => {
					const meta = SKILL_CHIP[skill]
					if (!meta) return null
					return (
						<span
							key={skill}
							className={cn(
								"inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
								meta.chipClass,
								meta.textClass,
							)}
						>
							{meta.label}
						</span>
					)
				})}
			</div>

			{/* Full test summary bar */}
			<div className="grid grid-cols-4 divide-x divide-border rounded-xl border bg-muted/30 text-center">
				{skillStats.map(({ skill, minutes, count, unit }) => {
					const meta = SKILL_CHIP[skill]
					if (!meta) return null
					return (
						<div key={skill} className="py-3">
							<p className="text-xs font-semibold text-muted-foreground">{meta.shortLabel}</p>
							<p className="mt-0.5 text-sm font-bold">{minutes} phút</p>
							<p className="text-[11px] text-muted-foreground">
								{count} {unit}
							</p>
						</div>
					)
				})}
			</div>
		</div>
	)
}
