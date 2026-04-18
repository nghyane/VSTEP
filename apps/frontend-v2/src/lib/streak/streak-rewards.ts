// Streak milestones — user nhận thưởng xu khi giữ streak đủ số ngày.
// Module-level store + localStorage persist cho trạng thái đã claim.

import { useSyncExternalStore } from "react"
import { refundCoins } from "#/lib/coins/coin-store"
import { pushNotification } from "#/features/notification"

export interface StreakMilestone {
	days: number
	coins: number
}

export const STREAK_MILESTONES: readonly StreakMilestone[] = [
	{ days: 7, coins: 100 },
	{ days: 14, coins: 250 },
	{ days: 30, coins: 500 },
] as const

export const DAILY_GOAL = 3 // đề thi thử/ngày để giữ streak

const STORAGE_KEY = "vstep:streak-claimed:v1"
const EVENT = "vstep:streak-claimed-change"

let claimed: ReadonlySet<number> = loadInitial()

function loadInitial(): Set<number> {
	if (typeof window === "undefined") return new Set()
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return new Set()
		const parsed = JSON.parse(raw) as unknown
		if (!Array.isArray(parsed)) return new Set()
		return new Set(parsed.filter((n): n is number => typeof n === "number"))
	} catch {
		return new Set()
	}
}

function persist() {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify([...claimed]))
	} catch {
		// ignore
	}
}

function emit() {
	persist()
	window.dispatchEvent(new CustomEvent(EVENT))
}

function subscribe(callback: () => void): () => void {
	window.addEventListener(EVENT, callback)
	return () => window.removeEventListener(EVENT, callback)
}

function getClaimed(): ReadonlySet<number> {
	return claimed
}

const EMPTY_SET: ReadonlySet<number> = new Set()

export function useClaimedMilestones(): ReadonlySet<number> {
	return useSyncExternalStore(subscribe, getClaimed, () => EMPTY_SET)
}

export function claimMilestone(days: number): boolean {
	const milestone = STREAK_MILESTONES.find((m) => m.days === days)
	if (!milestone) return false
	if (claimed.has(days)) return false
	const next = new Set(claimed)
	next.add(days)
	claimed = next
	emit()
	refundCoins(milestone.coins)
	pushNotification({
		id: `streak:claimed:${days}`,
		title: `+${milestone.coins} xu từ mốc ${days} ngày`,
		body: "Chúc mừng bạn đã nhận thưởng streak!",
		iconKey: "coin",
	})
	return true
}

/**
 * Quét các mốc đã đủ điều kiện nhưng chưa claim và push notification
 * (idempotent — mỗi mốc chỉ notify 1 lần nhờ dedup theo id).
 * Gọi khi app mount hoặc khi streak thay đổi.
 */
export function scanUnlockedMilestones(currentStreak: number) {
	for (const m of STREAK_MILESTONES) {
		if (currentStreak < m.days) continue
		if (claimed.has(m.days)) continue
		pushNotification({
			id: `streak:unlocked:${m.days}`,
			title: `Đã mở khoá mốc ${m.days} ngày streak`,
			body: `Vào overview để nhận +${m.coins} xu.`,
			iconKey: "trophy",
		})
	}
}

// ─── Today progress (local counter) ──────────────────────────────────────────
// Đếm số đề thi thử đã hoàn thành TRONG NGÀY, reset tự động khi đổi ngày.
// Nguồn dữ liệu: duy nhất luồng phong-thi gọi `recordPracticeCompletion()`.
// Luồng luyện tập (nghe/đọc/nói/viết) KHÔNG tính streak.

const PROGRESS_KEY = "vstep:streak-progress:v1"
const PROGRESS_EVENT = "vstep:streak-progress-change"

interface ProgressState {
	date: string // YYYY-MM-DD
	count: number
}

function todayKey(now: number = Date.now()): string {
	const d = new Date(now)
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

let progress: ProgressState = loadProgress()

function loadProgress(): ProgressState {
	const fallback: ProgressState = { date: todayKey(), count: 0 }
	if (typeof window === "undefined") return fallback
	try {
		const raw = localStorage.getItem(PROGRESS_KEY)
		if (!raw) return fallback
		const parsed = JSON.parse(raw) as Partial<ProgressState>
		if (typeof parsed.date !== "string" || typeof parsed.count !== "number") return fallback
		// Nếu đã sang ngày mới → reset counter, giữ entry mới.
		if (parsed.date !== todayKey()) return { date: todayKey(), count: 0 }
		return { date: parsed.date, count: parsed.count }
	} catch {
		return fallback
	}
}

function persistProgress() {
	try {
		localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
	} catch {
		// ignore
	}
}

function emitProgress() {
	persistProgress()
	window.dispatchEvent(new CustomEvent(PROGRESS_EVENT))
}

function subscribeProgress(callback: () => void): () => void {
	window.addEventListener(PROGRESS_EVENT, callback)
	return () => window.removeEventListener(PROGRESS_EVENT, callback)
}

function getProgressCount(): number {
	// Rollover nếu sang ngày mới khi đọc.
	const today = todayKey()
	if (progress.date !== today) {
		progress = { date: today, count: 0 }
		persistProgress()
	}
	return progress.count
}

export function useTodayProgress(): number {
	return useSyncExternalStore(subscribeProgress, getProgressCount, () => 0)
}

/**
 * Ghi nhận user vừa hoàn thành 1 đề thi thử.
 * Chỉ gọi từ luồng phong-thi — luyện tập không tính streak.
 * Trả về `{ reachedGoal: true }` nếu cú này là cú vừa chạm DAILY_GOAL
 * (để caller hiển thị toast "đã giữ streak hôm nay").
 */
export function recordPracticeCompletion(): { reachedGoal: boolean } {
	const today = todayKey()
	const was = progress.date === today ? progress.count : 0
	const next = was + 1
	progress = { date: today, count: next }
	emitProgress()
	const reachedGoal = was < DAILY_GOAL && next >= DAILY_GOAL
	if (reachedGoal) {
		pushNotification({
			id: `streak:goal:${today}`,
			title: `Đã giữ streak hôm nay (${DAILY_GOAL}/${DAILY_GOAL} đề thi thử)`,
			body: "Quay lại mai để nâng chuỗi học lên một ngày nữa!",
			iconKey: "fire",
		})
	}
	return { reachedGoal }
}
