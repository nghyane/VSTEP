import { StaticIcon } from "#/components/Icon"
import type { ExamDetail, SkillKey } from "#/features/exam/types"
import { cn } from "#/lib/utils"

interface Props {
	detail: ExamDetail
}

const SKILL_META: Record<SkillKey, { label: string; shortLabel: string; colorClass: string }> = {
	listening: { label: "Listening", shortLabel: "Nghe", colorClass: "text-skill-listening" },
	reading: { label: "Reading", shortLabel: "Đọc", colorClass: "text-skill-reading" },
	writing: { label: "Writing", shortLabel: "Viết", colorClass: "text-skill-writing" },
	speaking: { label: "Speaking", shortLabel: "Nói", colorClass: "text-skill-speaking" },
}

const SKILL_ORDER: SkillKey[] = ["listening", "reading", "writing", "speaking"]

export function ExamDetailHeader({ detail }: Props) {
	const { exam, version } = detail

	const skillStats: { skill: SkillKey; minutes: number; count: number }[] = [
		{
			skill: "listening",
			minutes: version.listening_sections.reduce((s, x) => s + x.duration_minutes, 0),
			count: version.listening_sections.reduce((s, x) => s + x.items.length, 0),
		},
		{
			skill: "reading",
			minutes: version.reading_passages.reduce((s, x) => s + x.duration_minutes, 0),
			count: version.reading_passages.reduce((s, x) => s + x.items.length, 0),
		},
		{
			skill: "writing",
			minutes: version.writing_tasks.reduce((s, x) => s + x.duration_minutes, 0),
			count: version.writing_tasks.length,
		},
		{
			skill: "speaking",
			minutes: version.speaking_parts.reduce((s, x) => s + x.duration_minutes, 0),
			count: version.speaking_parts.length,
		},
	]

	return (
		<div className="space-y-4">
			{/* Tags + title */}
			<div className="space-y-2">
				{exam.tags.length > 0 && (
					<div className="flex items-center gap-2 flex-wrap">
						{exam.tags.map((tag) => (
							<span
								key={tag}
								className="inline-flex items-center rounded-full bg-background border border-border px-2.5 py-0.5 text-xs font-medium text-muted"
							>
								#{tag}
							</span>
						))}
					</div>
				)}
				<h1 className="text-2xl font-extrabold leading-tight text-foreground">{exam.title}</h1>
			</div>

			{/* Meta */}
			<div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
				<span className="flex items-center gap-1.5">
					<StaticIcon name="timer-md" size="xs" />
					{exam.total_duration_minutes} phút
				</span>
			</div>

			{/* Skill chips */}
			<div className="flex flex-wrap gap-2">
				{SKILL_ORDER.map((skill) => {
					const meta = SKILL_META[skill]
					return (
						<span key={skill} className={cn("text-sm font-semibold", meta.colorClass)}>
							{meta.label}
						</span>
					)
				})}
			</div>

			{/* Summary bar */}
			<div className="card grid grid-cols-4 divide-x divide-border text-center">
				{skillStats.map(({ skill, minutes, count }) => {
					const meta = SKILL_META[skill]
					const unit = skill === "writing" || skill === "speaking" ? "phần" : "câu"
					return (
						<div key={skill} className="py-3">
							<p className={cn("text-xs font-bold", meta.colorClass)}>{meta.shortLabel}</p>
							<p className="mt-0.5 text-sm font-bold text-foreground">{minutes} phút</p>
							<p className="text-xs text-subtle">
								{count} {unit}
							</p>
						</div>
					)
				})}
			</div>
		</div>
	)
}
