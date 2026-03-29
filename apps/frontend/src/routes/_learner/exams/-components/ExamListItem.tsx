import { Clock01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Exam, Skill } from "@/types/api"
import { getBlueprint, SKILL_ORDER, skillMeta } from "./skill-meta"

function getExamSkills(exam: Exam): Skill[] {
	const bp = getBlueprint(exam)
	return SKILL_ORDER.filter((s) => (bp[s]?.questionIds.length ?? 0) > 0)
}

function getSkillQuestionCount(bp: ReturnType<typeof getBlueprint>, s: Skill): number {
	const section = bp[s]
	if (!section) return 0
	return section.questionCount ?? section.questionIds.length
}

function getTotalQuestions(exam: Exam): number {
	const bp = getBlueprint(exam)
	return SKILL_ORDER.reduce((sum, s) => sum + getSkillQuestionCount(bp, s), 0)
}

function getDuration(exam: Exam): number | undefined {
	return exam.durationMinutes ?? getBlueprint(exam).durationMinutes
}

function ExamListItem({
	exam,
	isSelected,
	onSelect,
	compact,
}: {
	exam: Exam
	isSelected: boolean
	onSelect: () => void
	compact: boolean
}) {
	const duration = getDuration(exam)
	const total = getTotalQuestions(exam)
	const skills = getExamSkills(exam)

	return (
		<button
			type="button"
			onClick={onSelect}
			className={cn(
				"flex w-full flex-col gap-1.5 rounded-2xl border text-left transition-all duration-200",
				compact ? "px-3 py-2.5" : "px-4 py-4",
				isSelected
					? "border-primary bg-primary/5 ring-1 ring-primary/20"
					: "border-transparent hover:bg-muted/50",
			)}
		>
			<div className="flex items-center justify-between gap-2">
				<span
					className={cn("font-medium leading-snug line-clamp-1", compact ? "text-sm" : "text-base")}
				>
					{exam.title || `${exam.level} — Đề thi thử`}
				</span>
				<Badge variant="secondary" className="shrink-0 text-[10px] font-bold">
					{exam.level}
				</Badge>
			</div>
			<div className="flex items-center gap-3 text-xs text-muted-foreground">
				{duration && (
					<span className="flex items-center gap-1">
						<HugeiconsIcon icon={Clock01Icon} className="size-3" />
						{duration}p
					</span>
				)}
				{total > 0 && <span>{total} câu</span>}
				<div className="ml-auto flex gap-1">
					{skills.map((s) => (
						<span
							key={s}
							className={cn("rounded-full", compact ? "size-1.5" : "size-2", `bg-skill-${s}`)}
							title={skillMeta[s].label}
						/>
					))}
				</div>
			</div>
		</button>
	)
}

export { ExamListItem, getExamSkills, getSkillQuestionCount, getTotalQuestions, getDuration }
