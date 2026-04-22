import { StaticIcon } from "#/components/Icon"
import type { ExamDetail, SkillKey } from "#/features/exam/types"
import { cn } from "#/lib/utils"

interface Props {
	detail: ExamDetail
}

const SKILL_META: Record<SkillKey, { label: string; colorClass: string }> = {
	listening: { label: "Listening", colorClass: "text-skill-listening" },
	reading: { label: "Reading", colorClass: "text-skill-reading" },
	writing: { label: "Writing", colorClass: "text-skill-writing" },
	speaking: { label: "Speaking", colorClass: "text-skill-speaking" },
}

const SKILL_ORDER: SkillKey[] = ["listening", "reading", "writing", "speaking"]

export function ExamDetailHeader({ detail }: Props) {
	const { exam, version } = detail

	const totalMcq =
		version.listening_sections.reduce((s, x) => s + x.items.length, 0) +
		version.reading_passages.reduce((s, x) => s + x.items.length, 0)
	const totalFreeResponse = version.writing_tasks.length + version.speaking_parts.length

	return (
		<div className="space-y-4">
			{/* Tags + title */}
			<div className="space-y-2">
				{exam.tags.length > 0 && (
					<div className="flex items-center gap-2 flex-wrap">
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
				<h1 className="text-2xl font-extrabold leading-tight text-foreground">{exam.title}</h1>
			</div>

			{/* Aggregate meta */}
			<div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
				<span className="flex items-center gap-1.5">
					<StaticIcon name="timer-md" size="xs" />
					{exam.total_duration_minutes} phút
				</span>
				<span className="text-border">·</span>
				<span>4 kỹ năng</span>
				<span className="text-border">·</span>
				<span>{totalMcq} câu trắc nghiệm</span>
				<span className="text-border">·</span>
				<span>{totalFreeResponse} phần tự luận</span>
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
		</div>
	)
}
