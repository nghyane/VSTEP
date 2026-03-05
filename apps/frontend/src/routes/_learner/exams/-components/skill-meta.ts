import { Book02Icon, HeadphonesIcon, Mic01Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import type { Exam, ExamBlueprint, Skill, Trend } from "@/types/api"

export const SKILL_ORDER: Skill[] = ["listening", "reading", "writing", "speaking"]

export const skillMeta: Record<Skill, { label: string; icon: IconSvgElement }> = {
	listening: { label: "Listening", icon: HeadphonesIcon },
	reading: { label: "Reading", icon: Book02Icon },
	writing: { label: "Writing", icon: PencilEdit02Icon },
	speaking: { label: "Speaking", icon: Mic01Icon },
}

export const skillColor: Record<Skill, string> = {
	listening: "bg-skill-listening/15 text-skill-listening",
	reading: "bg-skill-reading/15 text-skill-reading",
	writing: "bg-skill-writing/15 text-skill-writing",
	speaking: "bg-skill-speaking/15 text-skill-speaking",
}

export const skillColorText: Record<Skill, string> = {
	listening: "text-skill-listening",
	reading: "text-skill-reading",
	writing: "text-skill-writing",
	speaking: "text-skill-speaking",
}

export function getSmartTag(
	trend: Trend | undefined,
	isWeakest: boolean,
): { text: string; className: string } | null {
	if (trend === "insufficient_data")
		return { text: "Chưa luyện", className: "bg-muted text-muted-foreground" }
	if (trend === "declining")
		return { text: "Đang giảm", className: "bg-destructive/15 text-destructive" }
	if (isWeakest)
		return {
			text: "Cần học thêm",
			className: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
		}
	if (trend === "improving")
		return {
			text: "Tiến bộ",
			className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
		}
	if (trend === "stable") return { text: "Ổn định", className: "bg-muted text-muted-foreground" }
	return null
}

export function getBlueprint(exam: Exam): ExamBlueprint {
	return exam.blueprint as ExamBlueprint
}
