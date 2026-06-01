import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { PaginatedResponse, User } from "@/types/api"

function useAdminUsers(params?: { page?: number; search?: string; role?: string }) {
	const sp = new URLSearchParams()
	if (params?.page) sp.set("page", String(params.page))
	if (params?.search) sp.set("search", params.search)
	if (params?.role) sp.set("role", params.role)
	const qs = sp.toString()
	return useQuery({
		queryKey: ["admin-users", params],
		queryFn: () => api.get<PaginatedResponse<User>>(`/api/users${qs ? `?${qs}` : ""}`),
	})
}

function useCreateUser() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (body: { email: string; password: string; fullName?: string; role?: string }) =>
			api.post<User>("/api/users", body),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin-users"] })
		},
	})
}

function useAdminUpdateUser() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({
			id,
			...body
		}: {
			id: string
			email?: string
			fullName?: string | null
			role?: string
		}) => api.patch<User>(`/api/users/${id}`, body),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin-users"] })
		},
	})
}

function useDeleteUser() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete<{ id: string }>(`/api/users/${id}`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin-users"] })
		},
	})
}

export { useAdminUpdateUser, useAdminUsers, useCreateUser, useDeleteUser }
