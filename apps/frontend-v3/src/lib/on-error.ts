import { HTTPError } from "ky"
import { useAuth } from "#/lib/auth"
import { useToast } from "#/lib/toast"

export function onError(error: unknown) {
	if (!(error instanceof HTTPError)) {
		useToast.getState().add("Đã có lỗi xảy ra.")
		return
	}

	if (error.response.status === 401) {
		useAuth.getState().logout()
		return
	}

	const body = error.data as { message?: string } | undefined
	useToast.getState().add(body?.message ?? "Đã có lỗi xảy ra.")
}
