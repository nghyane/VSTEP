import { HTTPError } from "ky"
import { useAuth } from "#/lib/auth"
import { useToast } from "#/lib/toast"

export async function onError(error: unknown) {
	if (!(error instanceof HTTPError)) {
		useToast.getState().add("Đã có lỗi xảy ra.")
		return
	}

	if (error.response.status === 401) {
		useAuth.getState().logout()
		return
	}

	const body: { message?: string } | null = await error.response
		.clone()
		.json()
		.catch(() => null)
	useToast.getState().add(body?.message ?? "Đã có lỗi xảy ra.")
}
