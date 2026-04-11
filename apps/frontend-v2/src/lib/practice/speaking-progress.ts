// Speaking progress — localStorage wrapper.

export type SpeakingStatus = "not_started" | "completed"

export interface SpeakingProgress {
	status: SpeakingStatus
	recordedSeconds: number
	lastAttemptAt: number
}

const PREFIX = "vstep.speaking.v1.progress."
const EMPTY: SpeakingProgress = {
	status: "not_started",
	recordedSeconds: 0,
	lastAttemptAt: 0,
}

function key(id: string): string {
	return PREFIX + id
}

export function getSpeakingProgress(id: string): SpeakingProgress {
	if (typeof window === "undefined") return EMPTY
	const raw = window.localStorage.getItem(key(id))
	if (!raw) return EMPTY
	try {
		return JSON.parse(raw) as SpeakingProgress
	} catch {
		return EMPTY
	}
}

export function saveSpeakingProgress(id: string, progress: SpeakingProgress): void {
	if (typeof window === "undefined") return
	window.localStorage.setItem(key(id), JSON.stringify(progress))
}
