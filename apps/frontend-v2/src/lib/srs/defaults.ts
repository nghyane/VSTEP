// Default SRS config — khớp với Anki defaults_for_testing()
// Source: rslib/src/scheduler/states/mod.rs

import type { SrsConfig } from "./types"

export const DEFAULT_SRS_CONFIG: SrsConfig = {
	learningSteps: [1, 10], // phút
	relearningSteps: [10],
	graduatingIntervalGood: 1, // ngày
	graduatingIntervalEasy: 4,
	initialEaseFactor: 2.5,
	minEaseFactor: 1.3,
	easeDeltaAgain: -0.2,
	easeDeltaHard: -0.15,
	easeDeltaEasy: 0.15,
	hardMultiplier: 1.2,
	easyMultiplier: 1.3,
	intervalMultiplier: 1.0,
	maxReviewIntervalDays: 36500,
	lapseMultiplier: 0.0,
	minLapseIntervalDays: 1,
}

export const MS_PER_MINUTE = 60 * 1000
export const MS_PER_DAY = 24 * 60 * 60 * 1000

// Giới hạn new card mỗi ngày (Anki default)
export const DEFAULT_NEW_CARDS_PER_DAY = 20
