// Grammar mastery tracking — localStorage wrapper.
// Khi có API thật: swap storage layer, giữ nguyên interface ở UI.

export type MasteryLevel = "new" | "learning" | "practicing" | "mastered"

export interface GrammarMastery {
	attempts: number
	correct: number
	lastPracticedAt: number
}

const PREFIX = "vstep.grammar.v1.mastery."
const EMPTY: GrammarMastery = { attempts: 0, correct: 0, lastPracticedAt: 0 }

function key(pointId: string): string {
	return PREFIX + pointId
}

export function getMastery(pointId: string): GrammarMastery {
	if (typeof window === "undefined") return EMPTY
	const raw = window.localStorage.getItem(key(pointId))
	if (!raw) return EMPTY
	try {
		// JSON boundary: localStorage lưu string.
		const parsed = JSON.parse(raw) as GrammarMastery
		return parsed
	} catch {
		return EMPTY
	}
}

export function recordAnswer(pointId: string, correct: boolean): GrammarMastery {
	const current = getMastery(pointId)
	const next: GrammarMastery = {
		attempts: current.attempts + 1,
		correct: current.correct + (correct ? 1 : 0),
		lastPracticedAt: Date.now(),
	}
	if (typeof window !== "undefined") {
		window.localStorage.setItem(key(pointId), JSON.stringify(next))
	}
	return next
}

export function resetMastery(pointId: string): void {
	if (typeof window === "undefined") return
	window.localStorage.removeItem(key(pointId))
}

export function computeLevel(mastery: GrammarMastery): MasteryLevel {
	if (mastery.attempts === 0) return "new"
	const accuracy = mastery.correct / mastery.attempts
	if (mastery.attempts >= 5 && accuracy >= 0.85) return "mastered"
	if (mastery.attempts >= 3 && accuracy >= 0.6) return "practicing"
	return "learning"
}

export function accuracyPercent(mastery: GrammarMastery): number {
	if (mastery.attempts === 0) return 0
	return Math.round((mastery.correct / mastery.attempts) * 100)
}
