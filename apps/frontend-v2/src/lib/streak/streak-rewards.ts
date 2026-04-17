// Streak milestones — user nhận thưởng xu khi giữ streak đủ số ngày.
// Module-level store + localStorage persist cho trạng thái đã claim.

import { useSyncExternalStore } from "react"
import { refundCoins } from "#/lib/coins/coin-store"

export interface StreakMilestone {
	days: number
	coins: number
}

export const STREAK_MILESTONES: readonly StreakMilestone[] = [
	{ days: 7, coins: 100 },
	{ days: 14, coins: 250 },
	{ days: 30, coins: 500 },
] as const

export const DAILY_GOAL = 3 // bài/ngày để giữ streak

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
	return true
}

export function todayCompletedCount(
	activityByDay: Record<string, number>,
	now: number = Date.now(),
): number {
	const d = new Date(now)
	const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
	return activityByDay[key] ?? 0
}
