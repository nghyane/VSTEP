import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query"
import type { AdminTopupPackage, TopupPackageFormInput } from "#/features/admin-topup/types"
import { type ApiResponse, api } from "#/lib/api"

function invalidate(qc: QueryClient): void {
	qc.invalidateQueries({ queryKey: ["admin", "topup-packages"] })
}

export function useCreateTopupPackage() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: TopupPackageFormInput) =>
			api.post("admin/topup-packages", { json: input }).json<ApiResponse<AdminTopupPackage>>(),
		onSuccess: () => invalidate(qc),
	})
}

export function useUpdateTopupPackage() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: Partial<TopupPackageFormInput> }) =>
			api.patch(`admin/topup-packages/${id}`, { json: input }).json<ApiResponse<AdminTopupPackage>>(),
		onSuccess: () => invalidate(qc),
	})
}

export function useDeleteTopupPackage() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/topup-packages/${id}`),
		onSuccess: () => invalidate(qc),
	})
}

export function useSetTopupPackageActive() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, active }: { id: string; active: boolean }) =>
			api
				.post(`admin/topup-packages/${id}/${active ? "activate" : "deactivate"}`)
				.json<ApiResponse<AdminTopupPackage>>(),
		onSuccess: () => invalidate(qc),
	})
}
