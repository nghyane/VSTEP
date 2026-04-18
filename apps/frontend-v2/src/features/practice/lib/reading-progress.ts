// Reading progress — localStorage wrapper per exercise.

export type ReadingStatus = "not_started" | "in_progress" | "completed"

export interface ReadingProgress {
	status: ReadingStatus
	score: number
	total: number
	lastAttemptAt: number
}

const PREFIX = "vstep.reading.v1.progress."
const EMPTY: ReadingProgress = {
	status: "not_started",
	score: 0,
	total: 0,
	lastAttemptAt: 0,
}

function key(exerciseId: string): string {
	return PREFIX + exerciseId
}

export function getReadingProgress(exerciseId: string): ReadingProgress {
	if (typeof window === "undefined") return EMPTY
	const raw = window.localStorage.getItem(key(exerciseId))
	if (!raw) return EMPTY
	try {
		// JSON boundary: localStorage lưu string.
		const parsed = JSON.parse(raw) as ReadingProgress
		return parsed
	} catch {
		return EMPTY
	}
}

export function saveReadingProgress(exerciseId: string, progress: ReadingProgress): void {
	if (typeof window === "undefined") return
	window.localStorage.setItem(key(exerciseId), JSON.stringify(progress))
}

export function resetReadingProgress(exerciseId: string): void {
	if (typeof window === "undefined") return
	window.localStorage.removeItem(key(exerciseId))
}
