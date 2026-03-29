export interface MCQQuestion {
	question: string
	options: string[]
	correctAnswer: number
}

export interface MCQContent {
	passage?: string
	audioUrl?: string
	questions: MCQQuestion[]
}

export interface WritingContent {
	prompt: string
}

export interface SpeakingContent {
	prompt: string
	audioUrl?: string
}

export type AssignmentContent = MCQContent | WritingContent | SpeakingContent

export function parseContent(raw: string | null, skill: string | null): AssignmentContent | null {
	if (!raw) return null
	try {
		return JSON.parse(raw) as AssignmentContent
	} catch {
		// Legacy plain text — wrap as prompt
		if (skill === "writing") return { prompt: raw }
		if (skill === "speaking") return { prompt: raw }
		return null
	}
}

export function isMCQContent(c: AssignmentContent): c is MCQContent {
	return "questions" in c && Array.isArray((c as MCQContent).questions)
}
