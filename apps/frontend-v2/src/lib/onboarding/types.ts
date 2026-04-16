// Shared types for onboarding wizard

export type Level = "A1" | "A2" | "B1" | "B2" | "C1"

export type Skill = "listening" | "reading" | "writing" | "speaking"

export type Motivation =
	| "graduation"
	| "job_requirement"
	| "scholarship"
	| "personal"
	| "certification"

export interface OnboardingData {
	entryLevel: Level
	examDate: Date | null
	targetBand: Level
	weaknesses: Skill[]
	motivation: Motivation | null
}
