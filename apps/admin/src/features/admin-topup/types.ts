export interface AdminTopupPackage {
	id: string
	label: string
	amount_vnd: number
	coins_base: number
	bonus_coins: number
	total_coins: number
	display_order: number
	is_active: boolean
	is_best_value: boolean
	created_at: string
	updated_at: string
}

export interface TopupPackageFormInput {
	label: string
	amount_vnd: number
	coins_base: number
	bonus_coins: number
	display_order: number
	is_active: boolean
	is_best_value: boolean
}

export interface ListPackagesFilters {
	page?: number
	per_page?: number
	q?: string
	is_active?: "yes" | "no" | undefined
	sort?: "display_order" | "amount_vnd" | "coins_base" | "created_at"
	order?: "asc" | "desc"
}
