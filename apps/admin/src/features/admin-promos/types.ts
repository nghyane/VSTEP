export const PROMO_STATUSES = ["active", "inactive", "expired"] as const
export type PromoStatus = (typeof PROMO_STATUSES)[number]

export const PROMO_STATUS_LABELS: Record<PromoStatus, string> = {
	active: "Đang hoạt động",
	inactive: "Đã tắt",
	expired: "Hết hạn",
}

export interface AdminPromoCode {
	id: string
	code: string
	partner_name: string | null
	amount_coins: number
	max_total_uses: number | null
	per_account_limit: number
	expires_at: string | null
	is_active: boolean
	redemptions_count?: number
	created_at: string
}

export interface PromoListFilters {
	page?: number
	per_page?: number
	q?: string
	status?: PromoStatus | ""
}

export interface CreatePromoInput {
	code: string
	partner_name?: string | null
	amount_coins: number
	max_total_uses?: number | null
	per_account_limit: number
	expires_at?: string | null
	is_active?: boolean
}

export type UpdatePromoInput = Partial<CreatePromoInput>
