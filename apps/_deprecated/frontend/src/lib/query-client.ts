import { QueryClient } from "@tanstack/react-query"
import { handleAuthError } from "@/lib/auth"

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5,
			retry: (count, error) => {
				if (
					error instanceof Error &&
					"status" in error &&
					(error as { status: number }).status === 401
				)
					return false
				return count < 1
			},
		},
		mutations: {
			onError: (error) => {
				if (
					error instanceof Error &&
					"status" in error &&
					(error as { status: number }).status === 401
				) {
					handleAuthError()
				}
			},
		},
	},
})

queryClient.getQueryCache().config.onError = (error) => {
	if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
		handleAuthError()
	}
}
