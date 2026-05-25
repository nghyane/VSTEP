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

export interface PromoRedeemResult {
	coins_granted: number
	balance_after: number
	transaction_id: string
	redeemed_at: string
}

export interface TopupOrder {
	id: string
	order_code: number
	profile_id: string
	package_id: string
	amount_vnd: number
	coins_to_credit: number
	status: "pending" | "paid" | "failed" | "cancelled" | "expired"
	payment_provider: string
	payment_url: string | null
	provider_ref: string | null
	paid_at: string | null
	expires_at: string | null
	created_at: string
}
