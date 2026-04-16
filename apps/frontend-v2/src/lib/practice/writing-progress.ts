// Writing progress — localStorage wrapper per exercise.

export type WritingStatus = "not_started" | "in_progress" | "completed"

export interface WritingProgress {
	status: WritingStatus
	wordCount: number
	keywordHitRate: number // 0-1
	lastAttemptAt: number
}

const PREFIX = "vstep.writing.v1.progress."
const EMPTY: WritingProgress = {
	status: "not_started",
	wordCount: 0,
	keywordHitRate: 0,
	lastAttemptAt: 0,
}

function key(id: string): string {
	return PREFIX + id
}

export function getWritingProgress(id: string): WritingProgress {
	if (typeof window === "undefined") return EMPTY
	const raw = window.localStorage.getItem(key(id))
	if (!raw) return EMPTY
	try {
		// JSON boundary: localStorage lưu string.
		return JSON.parse(raw) as WritingProgress
	} catch {
		return EMPTY
	}
}

export function saveWritingProgress(id: string, progress: WritingProgress): void {
	if (typeof window === "undefined") return
	window.localStorage.setItem(key(id), JSON.stringify(progress))
}
