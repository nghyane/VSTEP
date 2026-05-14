import type { ListFilters } from "#/features/admin-practice/types"

export function buildListSearch(filters: ListFilters): string {
	const params = new URLSearchParams()
	if (filters.page) params.set("page", String(filters.page))
	if (filters.per_page) params.set("per_page", String(filters.per_page))
	if (filters.q) params.set("q", filters.q)
	if (filters.is_published === "yes") params.set("is_published", "1")
	if (filters.is_published === "no") params.set("is_published", "0")
	if (filters.part) params.set("part", String(filters.part))
	if (filters.level) params.set("level", filters.level)
	const qs = params.toString()
	return qs ? `?${qs}` : ""
}
