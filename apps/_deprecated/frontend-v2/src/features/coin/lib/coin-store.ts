// Module-level coin balance store với localStorage persist.
// Pattern: giống ai-chat store — CustomEvent broadcast cho useSyncExternalStore.

import { useSyncExternalStore } from "react"
import type { ExamSkillKey } from "#/mocks/thi-thu"

const STORAGE_KEY = "vstep:coins:v1"
const EVENT = "vstep:coins-change"
const INITIAL_BALANCE = 100

export const FULL_TEST_COST = 25
const COST_PER_SKILL = 8

let balance: number = loadInitial()

function loadInitial(): number {
	if (typeof window === "undefined") return INITIAL_BALANCE
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (raw === null) return INITIAL_BALANCE
		const parsed = Number.parseInt(raw, 10)
		return Number.isFinite(parsed) && parsed >= 0 ? parsed : INITIAL_BALANCE
	} catch {
		return INITIAL_BALANCE
	}
}

function persist() {
	try {
		localStorage.setItem(STORAGE_KEY, String(balance))
	} catch {
		// quota/private mode — ignore
	}
}

function emit() {
	persist()
	window.dispatchEvent(new CustomEvent(EVENT))
}

export function getCoins(): number {
	return balance
}

function subscribe(callback: () => void): () => void {
	window.addEventListener(EVENT, callback)
	return () => window.removeEventListener(EVENT, callback)
}

export function useCoins(): number {
	return useSyncExternalStore(subscribe, getCoins, () => INITIAL_BALANCE)
}

export function spendCoins(amount: number): boolean {
	if (amount <= 0) return true
	if (balance < amount) return false
	balance -= amount
	emit()
	return true
}

export function refundCoins(amount: number) {
	if (amount <= 0) return
	balance += amount
	emit()
}

// ─── Cost policy ──────────────────────────────────────────────────────────────
// Full test = 25 xu. Section-only = 8 xu mỗi kỹ năng được chọn, cap tại 25 xu.
// Nếu user chọn >=3 kỹ năng (24 xu) thì gần như bằng full test, khuyến khích làm full.

export function computeSessionCost(skills: ReadonlySet<ExamSkillKey>): number {
	if (skills.size === 0) return FULL_TEST_COST
	return Math.min(FULL_TEST_COST, COST_PER_SKILL * skills.size)
}
