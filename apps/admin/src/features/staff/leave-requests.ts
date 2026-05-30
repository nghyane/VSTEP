import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { type ApiResponse, api } from "#/lib/api"

export type LeaveRequestStatus = "pending" | "approved" | "rejected"

export interface StaffLeaveRequestItem {
	id: string
	date: string
	reason: string | null
	status: LeaveRequestStatus
	reviewed_at: string | null
	created_at: string
	teacher: { id: string; full_name: string | null; email: string } | null
}

export interface StaffLeaveRequestPage {
	data: StaffLeaveRequestItem[]
	current_page: number
	last_page: number
	per_page: number
	total: number
}

export interface StaffLeaveRequestFilters {
	page?: number
	status?: LeaveRequestStatus | ""
}

function buildSearch(filters: StaffLeaveRequestFilters): string {
	const params = new URLSearchParams()
	if (filters.page) params.set("page", String(filters.page))
	if (filters.status) params.set("status", filters.status)
	const qs = params.toString()
	return qs ? `?${qs}` : ""
}

export const staffLeaveRequestsQuery = (filters: StaffLeaveRequestFilters) =>
	queryOptions({
		queryKey: ["admin", "leave-requests", filters],
		queryFn: () =>
			api.get(`admin/leave-requests${buildSearch(filters)}`).json<ApiResponse<StaffLeaveRequestPage>>(),
		staleTime: 30_000,
	})

export function useUpdateLeaveRequestStatus() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, status }: { id: string; status: Exclude<LeaveRequestStatus, "pending"> }) =>
			api
				.patch(`admin/leave-requests/${id}`, { json: { status } })
				.json<ApiResponse<StaffLeaveRequestItem>>(),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "leave-requests"] }),
	})
}
