import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { type ApiResponse, api, type PaginatedResponse } from "#/lib/api"
import type {
	AdminUser,
	AdminUserDetail,
	CreateUserInput,
	ReassignmentInput,
	UpdateUserInput,
	UserActiveCourse,
	UserListFilters,
} from "./types"

function buildSearch(filters: UserListFilters): string {
	const params = new URLSearchParams()
	if (filters.page) params.set("page", String(filters.page))
	if (filters.per_page) params.set("per_page", String(filters.per_page))
	if (filters.q) params.set("q", filters.q)
	if (filters.role) params.set("role", filters.role)
	const qs = params.toString()
	return qs ? `?${qs}` : ""
}

export const userListQuery = (filters: UserListFilters) =>
	queryOptions({
		queryKey: ["admin", "users", "list", filters],
		queryFn: () => api.get(`admin/users${buildSearch(filters)}`).json<PaginatedResponse<AdminUser>>(),
		staleTime: 30_000,
	})

export const userDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["admin", "users", "detail", id],
		queryFn: () => api.get(`admin/users/${id}`).json<ApiResponse<AdminUserDetail>>(),
	})

export const teacherActiveCoursesQuery = (id: string) =>
	queryOptions({
		queryKey: ["admin", "users", "teacher-active-courses", id],
		queryFn: () =>
			api.get(`admin/users/${id}/teacher-active-courses`).json<ApiResponse<UserActiveCourse[]>>(),
	})

function invalidateUserLists(qc: ReturnType<typeof useQueryClient>): void {
	qc.invalidateQueries({ queryKey: ["admin", "users", "list"] })
	// Picker teacher endpoint cũng bị ảnh hưởng (deactivate teacher → biến mất khỏi dropdown).
	qc.invalidateQueries({ queryKey: ["admin", "users", "teachers"] })
}

export function useCreateUser() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: CreateUserInput) =>
			api.post("admin/users", { json: input }).json<ApiResponse<AdminUser>>(),
		onSuccess: () => invalidateUserLists(qc),
	})
}

export function useUpdateUser(id: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: UpdateUserInput) =>
			api.patch(`admin/users/${id}`, { json: input }).json<ApiResponse<AdminUser>>(),
		onSuccess: () => {
			invalidateUserLists(qc)
			qc.invalidateQueries({ queryKey: ["admin", "users", "detail", id] })
		},
	})
}

export function useDeactivateUser() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, reassignments }: { id: string; reassignments?: ReassignmentInput[] }) =>
			api
				.post(`admin/users/${id}/deactivate`, { json: { reassignments: reassignments ?? [] } })
				.json<ApiResponse<{ success: boolean }>>(),
		onSuccess: (_d, { id }) => {
			invalidateUserLists(qc)
			qc.invalidateQueries({ queryKey: ["admin", "users", "detail", id] })
			// Courses của teacher có thể đã đổi teacher_id → invalidate course list.
			qc.invalidateQueries({ queryKey: ["admin", "courses", "list"] })
		},
	})
}

export function useActivateUser() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			api.post(`admin/users/${id}/activate`).json<ApiResponse<{ success: boolean }>>(),
		onSuccess: (_d, id) => {
			invalidateUserLists(qc)
			qc.invalidateQueries({ queryKey: ["admin", "users", "detail", id] })
		},
	})
}

export function useResetUserPassword() {
	return useMutation({
		mutationFn: (id: string) =>
			api.post(`admin/users/${id}/reset-password`).json<ApiResponse<{ new_password: string }>>(),
	})
}

export function useChangeMyPassword() {
	return useMutation({
		mutationFn: (input: { current_password: string; new_password: string }) =>
			api.post("me/change-password", { json: input }).json<ApiResponse<{ success: boolean }>>(),
	})
}
