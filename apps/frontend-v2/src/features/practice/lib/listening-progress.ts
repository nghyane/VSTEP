// Listening progress — localStorage wrapper per exercise.
// Key format: vstep.listening.v1.progress.{exerciseId}

export type ListeningStatus = "not_started" | "in_progress" | "completed"

export interface ListeningProgress {
	status: ListeningStatus
	score: number
	total: number
	lastAttemptAt: number
}

const PREFIX = "vstep.listening.v1.progress."
const EMPTY: ListeningProgress = {
	status: "not_started",
	score: 0,
	total: 0,
	lastAttemptAt: 0,
}

function key(exerciseId: string): string {
	return PREFIX + exerciseId
}

export function getListeningProgress(exerciseId: string): ListeningProgress {
	if (typeof window === "undefined") return EMPTY
	const raw = window.localStorage.getItem(key(exerciseId))
	if (!raw) return EMPTY
	try {
		// JSON boundary: localStorage lưu string.
		const parsed = JSON.parse(raw) as ListeningProgress
		return parsed
	} catch {
		return EMPTY
	}
}

export function saveListeningProgress(exerciseId: string, progress: ListeningProgress): void {
	if (typeof window === "undefined") return
	window.localStorage.setItem(key(exerciseId), JSON.stringify(progress))
}

export function resetListeningProgress(exerciseId: string): void {
	if (typeof window === "undefined") return
	window.localStorage.removeItem(key(exerciseId))
}
