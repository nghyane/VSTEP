import { QueryClient } from "@tanstack/react-query"
import { onError } from "#/lib/on-error"

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: { staleTime: 1000 * 60 * 5, retry: false },
		mutations: { onError },
	},
})

queryClient.getQueryCache().config.onError = onError
queryClient.getMutationCache().config.onError = onError
