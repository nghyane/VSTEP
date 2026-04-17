// Persistent log cho các lần hoàn thành bài thi thử (full-test + section).
// Dùng để track commitment: mỗi khóa yêu cầu N bài full-test trong thời hạn.
// Pattern giống enrollment-store: module state + CustomEvent broadcast.

import { useSyncExternalStore } from "react"

export interface ExamCompletion {
	examId: string
	completedAt: number
	/** True nếu user làm cả 4 kỹ năng (không có sections filter). */
	isFullTest: boolean
}

const STORAGE_KEY = "vstep:exam-completions:v1"
const EVENT = "vstep:exam-completions-change"
const MAX_KEEP = 200

let log: readonly ExamCompletion[] = loadInitial()

function loadInitial(): ExamCompletion[] {
	if (typeof window === "undefined") return []
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return []
		const parsed = JSON.parse(raw) as unknown
		if (!Array.isArray(parsed)) return []
		return parsed.filter(
			(e): e is ExamCompletion =>
				e !== null &&
				typeof e === "object" &&
				typeof (e as ExamCompletion).examId === "string" &&
				typeof (e as ExamCompletion).completedAt === "number" &&
				typeof (e as ExamCompletion).isFullTest === "boolean",
		)
	} catch {
		return []
	}
}

function persist() {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(log))
	} catch {
		// ignore
	}
}

function emit() {
	persist()
	window.dispatchEvent(new CustomEvent(EVENT))
}

function subscribe(cb: () => void): () => void {
	window.addEventListener(EVENT, cb)
	return () => window.removeEventListener(EVENT, cb)
}

function getSnapshot(): readonly ExamCompletion[] {
	return log
}

const EMPTY: readonly ExamCompletion[] = []

export function useExamCompletions(): readonly ExamCompletion[] {
	return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY)
}

/** Ghi lại 1 lần hoàn thành bài thi thử. Trim log ở MAX_KEEP (FIFO). */
export function recordExamCompletion(examId: string, isFullTest: boolean): void {
	const entry: ExamCompletion = {
		examId,
		completedAt: Date.now(),
		isFullTest,
	}
	const next = [...log, entry].slice(-MAX_KEEP)
	log = next
	emit()
}

/** Đếm số bài full-test đã hoàn thành trong [fromMs, toMs]. */
export function countFullTestsInWindow(fromMs: number, toMs: number): number {
	return log.filter((e) => e.isFullTest && e.completedAt >= fromMs && e.completedAt <= toMs).length
}
