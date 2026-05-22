import type { PromoRedeemResult, TopupOrder } from "#/features/wallet/types"
import { type ApiResponse, api } from "#/lib/api"

export async function createTopupOrder(packageId: string): Promise<TopupOrder> {
	const res = await api
		.post("wallet/topup", { json: { package_id: packageId, payment_provider: "mock" } })
		.json<ApiResponse<TopupOrder>>()
	return res.data
}

export async function confirmTopupOrder(orderId: string): Promise<TopupOrder> {
	const res = await api.post(`wallet/topup/${orderId}/confirm`).json<ApiResponse<TopupOrder>>()
	return res.data
}

export async function redeemPromoCode(code: string): Promise<PromoRedeemResult> {
	const res = await api.post("wallet/promo-redeem", { json: { code } }).json<ApiResponse<PromoRedeemResult>>()
	return res.data
}
