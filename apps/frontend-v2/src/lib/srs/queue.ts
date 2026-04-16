// Study queue builder — tách word thành new/learning/review due.
// Thứ tự xử lý trong phiên: learning → review → new (Anki default).

import { DEFAULT_NEW_CARDS_PER_DAY } from "./defaults"
import type { CardState } from "./types"

export interface StudyQueue {
	learning: string[] // learning/relearning đang due
	review: string[] // review due
	new: string[] // new card trong giới hạn new/ngày
}

export interface QueueCounts {
	learning: number
	review: number
	new: number
	total: number
}

export function buildQueue(
	wordIds: readonly string[],
	states: ReadonlyMap<string, CardState>,
	now: number,
	newLimit: number = DEFAULT_NEW_CARDS_PER_DAY,
): StudyQueue {
	const learning: string[] = []
	const review: string[] = []
	const newCards: string[] = []

	for (const id of wordIds) {
		const state = states.get(id) ?? { kind: "new" }
		if (state.kind === "new") {
			newCards.push(id)
			continue
		}
		if (state.kind === "learning" || state.kind === "relearning") {
			if (state.dueAt <= now) learning.push(id)
			continue
		}
		// review
		if (state.dueAt <= now) review.push(id)
	}

	return {
		learning,
		review,
		new: newCards.slice(0, newLimit),
	}
}

export function queueCounts(queue: StudyQueue): QueueCounts {
	return {
		learning: queue.learning.length,
		review: queue.review.length,
		new: queue.new.length,
		total: queue.learning.length + queue.review.length + queue.new.length,
	}
}

// Lấy card đầu tiên theo priority Anki: learning → review → new
export function nextFromQueue(queue: StudyQueue): string | null {
	return queue.learning[0] ?? queue.review[0] ?? queue.new[0] ?? null
}

// Số từ đã "thuộc" trong topic = ở state review với interval >= 1 ngày.
export function countMastered(
	wordIds: readonly string[],
	states: ReadonlyMap<string, CardState>,
): number {
	let count = 0
	for (const id of wordIds) {
		const state = states.get(id)
		if (state?.kind === "review" && state.intervalDays >= 1) count += 1
	}
	return count
}
