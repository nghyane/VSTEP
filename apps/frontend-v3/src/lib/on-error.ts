import { HTTPError } from "ky"
import { useToast } from "#/lib/toast"

/**
 * Global error handler for TanStack Query mutations.
 * Queries handle errors locally in components (error states, fallbacks).
 * 401 is handled transparently by the ky afterResponse interceptor
 * (token refresh + retry) — it never reaches this handler.
 */
export function onError(error: unknown) {
	if (!(error instanceof HTTPError)) {
		useToast.getState().add("Đã có lỗi xảy ra.")
		return
	}

	const body = error.data as { message?: string } | undefined
	useToast.getState().add(body?.message ?? "Đã có lỗi xảy ra.")
}
