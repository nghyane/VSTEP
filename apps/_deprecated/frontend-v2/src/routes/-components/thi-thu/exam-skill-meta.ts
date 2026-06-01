export type ExamSkillKey = "listening" | "reading" | "writing" | "speaking"

export interface ExamSkillMeta {
	key: ExamSkillKey
	label: "Listening" | "Reading" | "Writing" | "Speaking"
	textClass: string
}

export const EXAM_SKILLS: readonly ExamSkillMeta[] = [
	{ key: "listening", label: "Listening", textClass: "text-skill-listening" },
	{ key: "reading", label: "Reading", textClass: "text-skill-reading" },
	{ key: "writing", label: "Writing", textClass: "text-skill-writing" },
	{ key: "speaking", label: "Speaking", textClass: "text-skill-speaking" },
] as const
