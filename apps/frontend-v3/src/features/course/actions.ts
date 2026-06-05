import type { EnrollmentOrder, PaymentProvider } from "#/features/course/types"
import { type ApiResponse, api } from "#/lib/api"

export async function createEnrollmentOrder(
	courseId: string,
	commitmentSignature: string,
	provider: PaymentProvider = "payos",
): Promise<EnrollmentOrder> {
	const res = await api
		.post(`courses/${courseId}/enrollment-orders`, {
			json: {
				payment_provider: provider,
				commitment_signature: commitmentSignature,
				return_url: `${window.location.origin}/wallet`,
				cancel_url: `${window.location.origin}/wallet`,
			},
		})
		.json<ApiResponse<EnrollmentOrder>>()
	return res.data
}

export async function cancelEnrollmentOrder(orderId: string): Promise<EnrollmentOrder> {
	const res = await api
		.post(`courses/enrollment-orders/${orderId}/cancel`)
		.json<ApiResponse<EnrollmentOrder>>()
	return res.data
}

export async function getEnrollmentOrderStatus(orderId: string): Promise<EnrollmentOrder | null> {
	const res = await api.get("courses/enrollment-orders").json<ApiResponse<EnrollmentOrder[]>>()
	return res.data.find((order) => order.id === orderId) ?? null
}
