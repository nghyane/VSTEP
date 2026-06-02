import type { Mutation } from "@tanstack/react-query"
import { isHTTPError } from "ky"
import { useToast } from "#/lib/toast"

/**
 * Global error handler for TanStack Query mutations (via MutationCache).
 *
 * Skip when the mutation has its own `onError` — the component handles
 * the error inline (e.g., feedback button shows error text next to itself).
 *
 * Otherwise classify:
 * - 4xx → silent; component may still read mutation.error.
 * - 5xx / network / timeout / unknown → toast notification.
 *
 * error.message is pre-normalized by the ky beforeError hook.
 */
export function onError(
	error: unknown,
	_variables: unknown,
	_context: unknown,
	mutation: Mutation<unknown, unknown, unknown, unknown>,
) {
	if (mutation.options.onError) return // component handles it locally

	if (isHTTPError(error)) {
		if (error.response.status < 500) return
		useToast.getState().add(error.message)
		return
	}
	if (error instanceof Error) {
		useToast.getState().add(error.message)
		return
	}
	useToast.getState().add("Đã có lỗi xảy ra.")
}
