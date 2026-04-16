export type ExamSkillKey = "listening" | "reading" | "writing" | "speaking"

export interface ExamSkillMeta {
	key: ExamSkillKey
	label: "Listening" | "Reading" | "Writing" | "Speaking"
	chipClass: string
	textClass: string
}

export const EXAM_SKILLS: readonly ExamSkillMeta[] = [
	{
		key: "listening",
		label: "Listening",
		chipClass: "bg-skill-listening/10",
		textClass: "text-skill-listening",
	},
	{
		key: "reading",
		label: "Reading",
		chipClass: "bg-skill-reading/10",
		textClass: "text-skill-reading",
	},
	{
		key: "writing",
		label: "Writing",
		chipClass: "bg-skill-writing/10",
		textClass: "text-skill-writing",
	},
	{
		key: "speaking",
		label: "Speaking",
		chipClass: "bg-skill-speaking/10",
		textClass: "text-skill-speaking",
	},
] as const
