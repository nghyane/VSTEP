import { queryOptions } from "@tanstack/react-query"
import type { ApiResponse } from "#/lib/api"
import { api } from "#/lib/api"
import type { AppConfig } from "./types"

export const appConfigQuery = queryOptions({
	queryKey: ["config"],
	queryFn: () => api.get("config").json<ApiResponse<AppConfig>>(),
	staleTime: 0,
})
