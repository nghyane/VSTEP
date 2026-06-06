import type { EnrollmentOrder, PaymentProvider } from "#/features/course/types"
import { type ApiResponse, api } from "#/lib/api"

export async function createEnrollmentOrder(
	courseId: string,
	commitmentSignature: string,
	provider: PaymentProvider = "payos",
): Promise<EnrollmentOrder> {
	const returnUrl = buildPaymentReturnUrl("course", courseId)
	const res = await api
		.post(`courses/${courseId}/enrollment-orders`, {
			json: {
				payment_provider: provider,
				commitment_signature: commitmentSignature,
				return_url: returnUrl,
				cancel_url: returnUrl,
			},
		})
		.json<ApiResponse<EnrollmentOrder>>()
	return res.data
}

function buildPaymentReturnUrl(flow: "course", courseId: string) {
	const url = new URL("/wallet", window.location.origin)
	url.searchParams.set("client", "web")
	url.searchParams.set("flow", flow)
	url.searchParams.set("courseId", courseId)
	return url.toString()
}

export async function cancelEnrollmentOrder(orderId: string): Promise<EnrollmentOrder> {
	const res = await api
		.post(`courses/enrollment-orders/${orderId}/cancel`)
		.json<ApiResponse<EnrollmentOrder>>()
	return res.data
}
