import type { PromoRedeemResult, TopupOrder } from "#/features/wallet/types"
import { type ApiResponse, api } from "#/lib/api"

export async function createTopupOrder(packageId: string, provider = "payos"): Promise<TopupOrder> {
	const res = await api
		.post("wallet/topup", {
			json: {
				package_id: packageId,
				payment_provider: provider,
				return_url: `${window.location.origin}/dashboard`,
			},
		})
		.json<ApiResponse<TopupOrder>>()
	return res.data
}

export async function getOrderStatus(orderId: string): Promise<TopupOrder> {
	const res = await api.get(`wallet/topup/${orderId}/status`).json<ApiResponse<TopupOrder>>()
	return res.data
}

export async function redeemPromoCode(code: string): Promise<PromoRedeemResult> {
	const res = await api.post("wallet/promo-redeem", { json: { code } }).json<ApiResponse<PromoRedeemResult>>()
	return res.data
}
