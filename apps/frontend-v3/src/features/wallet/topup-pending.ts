const PENDING_TOPUP_ORDER_KEY = "wallet.pendingTopupOrder"
export const TOPUP_RETURN_SIGNAL_KEY = "wallet.topupReturnSignal"

export interface PendingTopupOrder {
	orderId: string
	coins: number
	createdAt: number
}

export function savePendingTopupOrder(order: PendingTopupOrder) {
	if (typeof window === "undefined") return
	window.localStorage.setItem(PENDING_TOPUP_ORDER_KEY, JSON.stringify(order))
}

export function readPendingTopupOrder(): PendingTopupOrder | null {
	if (typeof window === "undefined") return null

	try {
		const raw = window.localStorage.getItem(PENDING_TOPUP_ORDER_KEY)
		if (!raw) return null
		const parsed = JSON.parse(raw) as unknown
		if (!isPendingTopupOrder(parsed)) return null
		return parsed
	} catch {
		return null
	}
}

export function clearPendingTopupOrder(orderId?: string) {
	if (typeof window === "undefined") return
	const pending = readPendingTopupOrder()
	if (orderId && pending?.orderId !== orderId) return
	window.localStorage.removeItem(PENDING_TOPUP_ORDER_KEY)
}

export function signalTopupReturn(paymentLinkId: string, status: string | undefined) {
	if (typeof window === "undefined") return
	window.localStorage.setItem(
		TOPUP_RETURN_SIGNAL_KEY,
		JSON.stringify({ paymentLinkId, status: status ?? null, at: Date.now() }),
	)
}

function isPendingTopupOrder(value: unknown): value is PendingTopupOrder {
	if (typeof value !== "object" || value === null) return false
	const record = value as Record<string, unknown>
	return (
		typeof record.orderId === "string" &&
		typeof record.coins === "number" &&
		Number.isFinite(record.coins) &&
		typeof record.createdAt === "number"
	)
}
