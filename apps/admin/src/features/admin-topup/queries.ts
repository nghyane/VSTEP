import { queryOptions } from "@tanstack/react-query"
import type { AdminTopupPackage, ListPackagesFilters } from "#/features/admin-topup/types"
import { api, type PaginatedResponse } from "#/lib/api"

function buildSearch(filters: ListPackagesFilters): string {
	const params = new URLSearchParams()
	if (filters.page) params.set("page", String(filters.page))
	if (filters.per_page) params.set("per_page", String(filters.per_page))
	if (filters.q) params.set("q", filters.q)
	if (filters.is_active === "yes") params.set("is_active", "1")
	if (filters.is_active === "no") params.set("is_active", "0")
	if (filters.sort) params.set("sort", filters.sort)
	if (filters.order) params.set("order", filters.order)
	const qs = params.toString()
	return qs ? `?${qs}` : ""
}

export const adminTopupPackagesQuery = (filters: ListPackagesFilters) =>
	queryOptions({
		queryKey: ["admin", "topup-packages", filters],
		queryFn: () =>
			api.get(`admin/topup-packages${buildSearch(filters)}`).json<PaginatedResponse<AdminTopupPackage>>(),
		staleTime: 30_000,
	})
