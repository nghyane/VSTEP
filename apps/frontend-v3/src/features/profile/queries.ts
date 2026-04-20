import { queryOptions } from "@tanstack/react-query"
import { api } from "#/lib/api"
import type { Profile } from "#/types/auth"

export const profilesQuery = queryOptions({
	queryKey: ["profiles"],
	queryFn: () => api.get("profiles").json<{ data: Profile[] }>(),
})
