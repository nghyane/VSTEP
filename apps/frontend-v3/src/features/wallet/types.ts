export interface WalletBalance {
	balance: number
	last_transaction_at: string | null
}

export interface TopupPackage {
	id: string
	label: string
	amount_vnd: number
	coins_base: number
	bonus_coins: number
	total_coins: number
	display_order: number
}

export interface TopupOrder {
	id: string
	profile_id: string
	package_id: string
	amount_vnd: number
	coins_to_credit: number
	status: "pending" | "paid" | "failed" | "cancelled"
	payment_provider: string
	provider_ref: string | null
	paid_at: string | null
	created_at: string
}
