import { MutationCache, QueryClient } from "@tanstack/react-query"
import { onError } from "#/lib/on-error"

export const queryClient = new QueryClient({
	mutationCache: new MutationCache({ onError }),
	defaultOptions: {
		queries: { staleTime: 1000 * 60 * 5, retry: false },
	},
})
