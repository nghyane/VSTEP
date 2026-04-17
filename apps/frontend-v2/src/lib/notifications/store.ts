// Notification store — module-level list + localStorage persist.
// Dedup theo id (caller tự quyết định id để idempotent push).

import { useSyncExternalStore } from "react"

export type NotificationIcon = "fire" | "coin" | "trophy"

export interface AppNotification {
	readonly id: string
	readonly title: string
	readonly body?: string
	readonly iconKey: NotificationIcon
	readonly createdAt: number
	readonly readAt: number | null
}

const STORAGE_KEY = "vstep:notifications:v1"
const EVENT = "vstep:notifications-change"
const MAX_KEEP = 30

let list: readonly AppNotification[] = loadInitial()

function loadInitial(): readonly AppNotification[] {
	if (typeof window === "undefined") return []
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return []
		const parsed = JSON.parse(raw) as unknown
		if (!Array.isArray(parsed)) return []
		return parsed.filter(
			(n): n is AppNotification =>
				typeof n === "object" &&
				n !== null &&
				typeof (n as AppNotification).id === "string" &&
				typeof (n as AppNotification).title === "string" &&
				typeof (n as AppNotification).createdAt === "number",
		)
	} catch {
		return []
	}
}

function persist() {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
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

function getList(): readonly AppNotification[] {
	return list
}

const EMPTY_LIST: readonly AppNotification[] = []

export function useNotifications(): readonly AppNotification[] {
	return useSyncExternalStore(subscribe, getList, () => EMPTY_LIST)
}

export function useUnreadCount(): number {
	const items = useNotifications()
	return items.reduce((n, x) => n + (x.readAt === null ? 1 : 0), 0)
}

export function pushNotification(input: {
	id: string
	title: string
	body?: string
	iconKey: NotificationIcon
}): boolean {
	// Idempotent: nếu id đã tồn tại → bỏ qua (dedup).
	if (list.some((n) => n.id === input.id)) return false
	const next: AppNotification = {
		id: input.id,
		title: input.title,
		body: input.body,
		iconKey: input.iconKey,
		createdAt: Date.now(),
		readAt: null,
	}
	list = [next, ...list].slice(0, MAX_KEEP)
	emit()
	return true
}

export function markAllRead() {
	const now = Date.now()
	let changed = false
	const next = list.map((n) => {
		if (n.readAt !== null) return n
		changed = true
		return { ...n, readAt: now }
	})
	if (!changed) return
	list = next
	emit()
}

export function removeNotification(id: string) {
	const next = list.filter((n) => n.id !== id)
	if (next.length === list.length) return
	list = next
	emit()
}

export function clearNotifications() {
	if (list.length === 0) return
	list = []
	emit()
}
