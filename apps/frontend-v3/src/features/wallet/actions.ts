import type { PromoRedeemResult, TopupOrder } from "#/features/wallet/types"
import { type ApiResponse, api } from "#/lib/api"

export async function createTopupOrder(packageId: string, provider = "payos"): Promise<TopupOrder> {
	const returnUrl = buildPaymentReturnUrl("topup")
	const res = await api
		.post("wallet/topup", {
			json: {
				package_id: packageId,
				payment_provider: provider,
				return_url: returnUrl,
				cancel_url: returnUrl,
			},
		})
		.json<ApiResponse<TopupOrder>>()
	return res.data
}

export async function getOrderStatus(orderId: string): Promise<TopupOrder> {
	const res = await api.get(`wallet/topup/${orderId}/status`).json<ApiResponse<TopupOrder>>()
	return res.data
}

export async function reportTopupPaymentReturn(paymentLinkId: string): Promise<TopupOrder> {
	const res = await api
		.post("wallet/topup/payment-return", {
			json: { id: paymentLinkId },
		})
		.json<ApiResponse<TopupOrder>>()
	return res.data
}

export async function redeemPromoCode(code: string): Promise<PromoRedeemResult> {
	const res = await api.post("wallet/promo-redeem", { json: { code } }).json<ApiResponse<PromoRedeemResult>>()
	return res.data
}

function buildPaymentReturnUrl(flow: "topup") {
	const url = new URL("/wallet", window.location.origin)
	url.searchParams.set("client", "web")
	url.searchParams.set("flow", flow)
	return url.toString()
}
