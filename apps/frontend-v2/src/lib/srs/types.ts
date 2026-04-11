// SRS (Spaced Repetition System) types, port rút gọn của Anki scheduler.
// Reference: docs/anki-srs-algorithm.md (dựa trên rslib/src/scheduler/states/).

export type Rating = 1 | 2 | 3 | 4 // 1=Again, 2=Hard, 3=Good, 4=Easy

export interface NewState {
	kind: "new"
}

export interface LearningState {
	kind: "learning"
	remainingSteps: number // số step còn lại (đếm ngược)
	dueAt: number // ms timestamp
}

export interface ReviewState {
	kind: "review"
	intervalDays: number
	easeFactor: number
	lapses: number
	dueAt: number
}

export interface RelearningState {
	kind: "relearning"
	remainingSteps: number
	dueAt: number
	// State review gốc cần giữ để quay về sau khi relearn xong
	reviewIntervalDays: number
	easeFactor: number
	lapses: number
}

export type CardState = NewState | LearningState | ReviewState | RelearningState

export interface SrsConfig {
	readonly learningSteps: readonly number[] // phút
	readonly relearningSteps: readonly number[] // phút
	readonly graduatingIntervalGood: number // ngày
	readonly graduatingIntervalEasy: number // ngày
	readonly initialEaseFactor: number
	readonly minEaseFactor: number
	readonly easeDeltaAgain: number
	readonly easeDeltaHard: number
	readonly easeDeltaEasy: number
	readonly hardMultiplier: number
	readonly easyMultiplier: number
	readonly intervalMultiplier: number
	readonly maxReviewIntervalDays: number
	readonly lapseMultiplier: number
	readonly minLapseIntervalDays: number
}
