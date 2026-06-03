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
				return_url: `${window.location.origin}/khoa-hoc/${courseId}`,
			},
		})
		.json<ApiResponse<EnrollmentOrder>>()
	return res.data
}
