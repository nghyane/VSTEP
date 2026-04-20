import { HTTPError } from "ky"
import { useToast } from "#/lib/toast"
import { useAuth } from "#/lib/auth"

async function extractMessage(error: unknown): Promise<string> {
	if (error instanceof HTTPError) {
		const body = await error.response.clone().json().catch(() => null)
		if (body && typeof body === "object" && "message" in body) return body.message as string
	}
	return "Đã có lỗi xảy ra."
}

export async function handleApiError(error: unknown) {
	if (error instanceof HTTPError && error.response.status === 401) {
		useAuth.getState().logout()
		return
	}
	const message = await extractMessage(error)
	useToast.getState().add(message)
}
