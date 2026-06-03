import type { QueryClient } from "@tanstack/react-query"

export function invalidateProgressQueries(queryClient: QueryClient) {
	queryClient.invalidateQueries({ queryKey: ["streak"] })
	queryClient.invalidateQueries({ queryKey: ["overview"] })
	queryClient.invalidateQueries({ queryKey: ["activity-heatmap"] })
}
