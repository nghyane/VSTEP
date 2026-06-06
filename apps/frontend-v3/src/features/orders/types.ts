export type OrderHistoryType = "topup" | "course"

export type OrderHistoryStatus = "pending" | "paid" | "failed" | "cancelled" | "expired"

export interface OrderHistoryItem {
	id: string
	type: OrderHistoryType
	type_label: string
	status: OrderHistoryStatus
	amount_vnd: number
	payment_provider: string
	order_code: number | null
	item_name: string
	coins_to_credit: number | null
	created_at: string
}
