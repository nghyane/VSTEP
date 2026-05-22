import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { type ApiResponse, api, type PaginatedResponse } from "#/lib/api"
import type { AdminPromoCode, CreatePromoInput, PromoListFilters, UpdatePromoInput } from "./types"

function buildSearch(filters: PromoListFilters): string {
	const params = new URLSearchParams()
	if (filters.page) params.set("page", String(filters.page))
	if (filters.per_page) params.set("per_page", String(filters.per_page))
	if (filters.q) params.set("q", filters.q)
	if (filters.status) params.set("status", filters.status)
	const qs = params.toString()
	return qs ? `?${qs}` : ""
}

export const promoListQuery = (filters: PromoListFilters) =>
	queryOptions({
		queryKey: ["admin", "promo-codes", "list", filters],
		queryFn: () =>
			api.get(`admin/promo-codes${buildSearch(filters)}`).json<PaginatedResponse<AdminPromoCode>>(),
		staleTime: 30_000,
	})

function invalidatePromoLists(qc: ReturnType<typeof useQueryClient>): void {
	qc.invalidateQueries({ queryKey: ["admin", "promo-codes", "list"] })
}

export function useGeneratePromoCode() {
	return useMutation({
		mutationFn: () => api.post("admin/promo-codes/generate-code").json<ApiResponse<{ code: string }>>(),
	})
}

export function useCreatePromo() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: CreatePromoInput) =>
			api.post("admin/promo-codes", { json: input }).json<ApiResponse<AdminPromoCode>>(),
		onSuccess: () => invalidatePromoLists(qc),
	})
}

export function useUpdatePromo(id: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: UpdatePromoInput) =>
			api.patch(`admin/promo-codes/${id}`, { json: input }).json<ApiResponse<AdminPromoCode>>(),
		onSuccess: () => invalidatePromoLists(qc),
	})
}
