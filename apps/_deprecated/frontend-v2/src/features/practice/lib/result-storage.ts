// Lưu tạm kết quả submit để trang kết quả riêng đọc.
// Dùng sessionStorage (mất khi đóng tab) — không persist lâu dài.
// Audio blob URL vẫn sống trong cùng tab nên lưu được.

export interface StoredWritingResult {
	readonly exerciseId: string
	readonly userText: string
	readonly wordCount: number
	readonly keywordsHit: readonly { keyword: string; hit: boolean }[]
	readonly keywordCoveragePct: number
	readonly wordCountInRange: boolean
	readonly hasMultipleParagraphs: boolean
	readonly stars: number
	readonly submittedAt: number
}

export interface StoredSpeakingResult {
	readonly exerciseId: string
	readonly mode: "dictation" | "shadowing"
	readonly dictationAccuracy: number // 0..1
	readonly sentencesDone: number
	readonly sentencesTotal: number
	readonly submittedAt: number
}

const WRITING_KEY = (id: string) => `vstep:result:writing:${id}`
const SPEAKING_KEY = (id: string) => `vstep:result:speaking:${id}`

export function saveWritingResult(result: StoredWritingResult) {
	try {
		sessionStorage.setItem(WRITING_KEY(result.exerciseId), JSON.stringify(result))
	} catch {
		// ignore
	}
}

export function loadWritingResult(exerciseId: string): StoredWritingResult | null {
	try {
		const raw = sessionStorage.getItem(WRITING_KEY(exerciseId))
		return raw ? (JSON.parse(raw) as StoredWritingResult) : null
	} catch {
		return null
	}
}

export function clearWritingResult(exerciseId: string) {
	sessionStorage.removeItem(WRITING_KEY(exerciseId))
}

export function saveSpeakingResult(result: StoredSpeakingResult) {
	try {
		sessionStorage.setItem(SPEAKING_KEY(result.exerciseId), JSON.stringify(result))
	} catch {
		// ignore
	}
}

export function loadSpeakingResult(exerciseId: string): StoredSpeakingResult | null {
	try {
		const raw = sessionStorage.getItem(SPEAKING_KEY(exerciseId))
		return raw ? (JSON.parse(raw) as StoredSpeakingResult) : null
	} catch {
		return null
	}
}

export function clearSpeakingResult(exerciseId: string) {
	sessionStorage.removeItem(SPEAKING_KEY(exerciseId))
}
