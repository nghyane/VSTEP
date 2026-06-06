const PENDING_ENROLLMENT_ORDER_KEY = "course.pendingEnrollmentOrder"

export interface PendingEnrollmentOrder {
	orderId: string
	courseId: string
	courseTitle: string
	bonusCoins: number
	createdAt: number
}

export function savePendingEnrollmentOrder(order: PendingEnrollmentOrder) {
	if (typeof window === "undefined") return
	window.localStorage.setItem(PENDING_ENROLLMENT_ORDER_KEY, JSON.stringify(order))
}

export function readPendingEnrollmentOrder(): PendingEnrollmentOrder | null {
	if (typeof window === "undefined") return null

	try {
		const raw = window.localStorage.getItem(PENDING_ENROLLMENT_ORDER_KEY)
		if (!raw) return null
		const parsed = JSON.parse(raw) as unknown
		if (!isPendingEnrollmentOrder(parsed)) return null
		return parsed
	} catch {
		return null
	}
}

export function clearPendingEnrollmentOrder(orderId?: string) {
	if (typeof window === "undefined") return
	const pending = readPendingEnrollmentOrder()
	if (orderId && pending?.orderId !== orderId) return
	window.localStorage.removeItem(PENDING_ENROLLMENT_ORDER_KEY)
}

function isPendingEnrollmentOrder(value: unknown): value is PendingEnrollmentOrder {
	if (typeof value !== "object" || value === null) return false
	const record = value as Record<string, unknown>
	return (
		typeof record.orderId === "string" &&
		typeof record.courseId === "string" &&
		typeof record.courseTitle === "string" &&
		typeof record.bonusCoins === "number" &&
		Number.isFinite(record.bonusCoins) &&
		typeof record.createdAt === "number"
	)
}
