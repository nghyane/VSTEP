// SRS scheduler — port rút gọn của Anki (không fuzz, không leech, không FSRS).
// Reference: docs/anki-srs-algorithm.md §4-7

import { MS_PER_DAY, MS_PER_MINUTE } from "./defaults"
import type { CardState, LearningState, Rating, ReviewState, SrsConfig } from "./types"

// ─── Entry point ───────────────────────────────────────────────────

export function nextState(
	state: CardState,
	rating: Rating,
	config: SrsConfig,
	now: number,
): CardState {
	switch (state.kind) {
		case "new":
			// New card = learning card đã failed, full steps remaining
			return applyLearning(
				{ kind: "learning", remainingSteps: config.learningSteps.length, dueAt: now },
				rating,
				config,
				now,
				config.learningSteps,
				null,
			)
		case "learning":
			return applyLearning(state, rating, config, now, config.learningSteps, null)
		case "review":
			return applyReview(state, rating, config, now)
		case "relearning":
			return applyLearning(
				{
					kind: "learning",
					remainingSteps: state.remainingSteps,
					dueAt: state.dueAt,
				},
				rating,
				config,
				now,
				config.relearningSteps,
				{
					intervalDays: state.reviewIntervalDays,
					easeFactor: state.easeFactor,
					lapses: state.lapses,
				},
			)
	}
}

// ─── Learning / Relearning ─────────────────────────────────────────

interface ReviewReturnInfo {
	intervalDays: number
	easeFactor: number
	lapses: number
}

function applyLearning(
	state: LearningState,
	rating: Rating,
	config: SrsConfig,
	now: number,
	steps: readonly number[],
	reviewReturn: ReviewReturnInfo | null,
): CardState {
	if (rating === 4) return graduateEasy(config, now, reviewReturn)
	if (rating === 1) return learningAgain(steps, now)
	if (rating === 2) return learningHard(state, steps, now, reviewReturn)
	// Rating 3 = Good
	return learningGood(state, config, steps, now, reviewReturn)
}

function learningAgain(steps: readonly number[], now: number): LearningState {
	const firstStep = steps[0] ?? 1
	return {
		kind: "learning",
		remainingSteps: steps.length,
		dueAt: now + firstStep * MS_PER_MINUTE,
	}
}

function learningHard(
	state: LearningState,
	steps: readonly number[],
	now: number,
	reviewReturn: ReviewReturnInfo | null,
): CardState {
	const idx = stepIndex(state.remainingSteps, steps.length)
	const currentStep = steps[idx] ?? 1
	// Ở step đầu: delay đặc biệt (trung bình step[0]+step[1], hoặc step[0] * 1.5)
	let delayMinutes: number
	if (idx === 0) {
		const nextStep = steps[1]
		delayMinutes = nextStep !== undefined ? (currentStep + nextStep) / 2 : currentStep * 1.5
	} else {
		delayMinutes = currentStep
	}
	// Với relearning single-step, nếu hết step thì giữ nguyên state
	return rebuildLearning(state.remainingSteps, now + delayMinutes * MS_PER_MINUTE, reviewReturn)
}

function learningGood(
	state: LearningState,
	config: SrsConfig,
	steps: readonly number[],
	now: number,
	reviewReturn: ReviewReturnInfo | null,
): CardState {
	const newRemaining = state.remainingSteps - 1
	if (newRemaining <= 0) return graduateGood(config, now, reviewReturn)
	const nextIdx = stepIndex(newRemaining, steps.length)
	const nextStep = steps[nextIdx] ?? 1
	return rebuildLearning(newRemaining, now + nextStep * MS_PER_MINUTE, reviewReturn)
}

function rebuildLearning(
	remainingSteps: number,
	dueAt: number,
	reviewReturn: ReviewReturnInfo | null,
): CardState {
	if (reviewReturn) {
		return {
			kind: "relearning",
			remainingSteps,
			dueAt,
			reviewIntervalDays: reviewReturn.intervalDays,
			easeFactor: reviewReturn.easeFactor,
			lapses: reviewReturn.lapses,
		}
	}
	return { kind: "learning", remainingSteps, dueAt }
}

// ─── Graduation ────────────────────────────────────────────────────

function graduateGood(
	config: SrsConfig,
	now: number,
	reviewReturn: ReviewReturnInfo | null,
): ReviewState {
	// Relearning Good → quay về Review với interval đã giảm từ lapse
	if (reviewReturn) {
		return {
			kind: "review",
			intervalDays: Math.max(reviewReturn.intervalDays, config.minLapseIntervalDays),
			easeFactor: reviewReturn.easeFactor,
			lapses: reviewReturn.lapses,
			dueAt: now + reviewReturn.intervalDays * MS_PER_DAY,
		}
	}
	return {
		kind: "review",
		intervalDays: config.graduatingIntervalGood,
		easeFactor: config.initialEaseFactor,
		lapses: 0,
		dueAt: now + config.graduatingIntervalGood * MS_PER_DAY,
	}
}

function graduateEasy(
	config: SrsConfig,
	now: number,
	reviewReturn: ReviewReturnInfo | null,
): ReviewState {
	// Relearning Easy → quay về Review với interval + 1
	if (reviewReturn) {
		const intervalDays = reviewReturn.intervalDays + 1
		return {
			kind: "review",
			intervalDays,
			easeFactor: reviewReturn.easeFactor,
			lapses: reviewReturn.lapses,
			dueAt: now + intervalDays * MS_PER_DAY,
		}
	}
	return {
		kind: "review",
		intervalDays: config.graduatingIntervalEasy,
		easeFactor: config.initialEaseFactor,
		lapses: 0,
		dueAt: now + config.graduatingIntervalEasy * MS_PER_DAY,
	}
}

// ─── Review state transitions ──────────────────────────────────────

function applyReview(
	state: ReviewState,
	rating: Rating,
	config: SrsConfig,
	now: number,
): CardState {
	if (rating === 1) return reviewAgain(state, config, now)
	const current = Math.max(state.intervalDays, 1)
	const daysLate = Math.max(0, Math.floor((now - state.dueAt) / MS_PER_DAY))

	if (rating === 2) {
		const interval = clampInterval(current * config.hardMultiplier, current + 1, config)
		return buildReviewState(
			interval,
			state.easeFactor + config.easeDeltaHard,
			state.lapses,
			now,
			config,
		)
	}
	if (rating === 3) {
		const hardInterval = current * config.hardMultiplier
		const interval = clampInterval(
			(current + daysLate / 2) * state.easeFactor,
			hardInterval + 1,
			config,
		)
		return buildReviewState(interval, state.easeFactor, state.lapses, now, config)
	}
	// Easy (4)
	const goodInterval = (current + daysLate / 2) * state.easeFactor
	const interval = clampInterval(
		(current + daysLate) * state.easeFactor * config.easyMultiplier,
		goodInterval + 1,
		config,
	)
	return buildReviewState(
		interval,
		state.easeFactor + config.easeDeltaEasy,
		state.lapses,
		now,
		config,
	)
}

function reviewAgain(state: ReviewState, config: SrsConfig, now: number): CardState {
	const lapses = state.lapses + 1
	const failingInterval = Math.max(
		Math.round(state.intervalDays * config.lapseMultiplier),
		config.minLapseIntervalDays,
	)
	const newEase = Math.max(config.minEaseFactor, state.easeFactor + config.easeDeltaAgain)

	// Có relearn steps → vào Relearning
	if (config.relearningSteps.length > 0) {
		const firstStep = config.relearningSteps[0] ?? 10
		return {
			kind: "relearning",
			remainingSteps: config.relearningSteps.length,
			dueAt: now + firstStep * MS_PER_MINUTE,
			reviewIntervalDays: failingInterval,
			easeFactor: newEase,
			lapses,
		}
	}
	// Không có relearn steps → ở lại Review với interval giảm
	return {
		kind: "review",
		intervalDays: failingInterval,
		easeFactor: newEase,
		lapses,
		dueAt: now + failingInterval * MS_PER_DAY,
	}
}

function buildReviewState(
	intervalDays: number,
	easeFactor: number,
	lapses: number,
	now: number,
	config: SrsConfig,
): ReviewState {
	const clampedEase = Math.max(config.minEaseFactor, easeFactor)
	return {
		kind: "review",
		intervalDays,
		easeFactor: clampedEase,
		lapses,
		dueAt: now + intervalDays * MS_PER_DAY,
	}
}

// ─── Utilities ─────────────────────────────────────────────────────

function stepIndex(remaining: number, totalSteps: number): number {
	return Math.max(0, totalSteps - remaining)
}

function clampInterval(raw: number, minimum: number, config: SrsConfig): number {
	const adjusted = raw * config.intervalMultiplier
	return Math.max(minimum, Math.min(config.maxReviewIntervalDays, Math.round(adjusted)))
}

// ─── Preview (cho UI) ──────────────────────────────────────────────

export interface IntervalPreview {
	again: number // giây
	hard: number
	good: number
	easy: number
}

export function previewIntervals(
	state: CardState,
	config: SrsConfig,
	now: number,
): IntervalPreview {
	const run = (rating: Rating) => {
		const next = nextState(state, rating, config, now)
		if (next.kind === "new") return 0
		return Math.max(0, Math.round((next.dueAt - now) / 1000))
	}
	return {
		again: run(1),
		hard: run(2),
		good: run(3),
		easy: run(4),
	}
}
