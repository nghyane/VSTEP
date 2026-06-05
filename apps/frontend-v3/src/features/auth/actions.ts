import { type ApiResponse, api } from "#/lib/api"

export async function requestPasswordReset(email: string) {
	return api.post("auth/forgot-password", { json: { email } }).json<ApiResponse<{ success: boolean }>>()
}

export async function resetPassword(input: {
	email: string
	token: string
	password: string
	password_confirmation: string
}) {
	return api.post("auth/reset-password", { json: input }).json<ApiResponse<{ success: boolean }>>()
}

export async function resendEmailVerification(email: string) {
	return api
		.post("auth/email/verification-notification", { json: { email } })
		.json<ApiResponse<{ success: boolean }>>()
}
