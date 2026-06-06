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
	impact_summary?: LeaveImpactSummary
}

export interface LeaveImpactSummary {
	schedule_items_count: number
	bookings_count: number
	open_slots_count: number
}

export interface LeaveLearnerContact {
	profile_id: string | null
	full_name: string | null
	email: string | null
	phone_number: string | null
}

export interface LeaveScheduleImpact {
	id: string
	course_id: string
	course_title: string | null
	course_start_date: string | null
	course_end_date: string | null
	session_number: number
	date: string
	start_time: string
	end_time: string
	topic: string
	status: "scheduled" | "cancelled" | string
	cancel_reason: string | null
	learners: LeaveLearnerContact[]
}

export interface LeaveBookingImpact {
	id: string
	status: "booked" | "completed" | "cancelled" | string
	meet_url: string | null
	slot: {
		id: string | null
		course_id: string | null
		course_title: string | null
		starts_at: string | null
		duration_minutes: number
	}
	learner: LeaveLearnerContact
	coins_paid?: number
	refund_status?: "refunded" | "not_refunded"
}

export interface LeaveOpenSlotImpact {
	id: string
	teacher_id: string
	course_id: string
	course_title: string | null
	starts_at: string
	duration_minutes: number
	status: "open" | "booked" | string
}

export interface TeacherDaySchedule {
	schedule_items: Array<{
		id: string
		course_id: string
		course_title: string | null
		date: string
		start_time: string
		end_time: string
		topic: string
		status: "scheduled" | "cancelled" | string
	}>
	slots: Array<{
		id: string
		course_id: string
		course_title: string | null
		starts_at: string
		duration_minutes: number
		status: "open" | "booked" | string
	}>
}

export interface StaffLeaveRequestDetail {
	leave: StaffLeaveRequestItem
	summary: LeaveImpactSummary
	impacts: {
		schedule_items: LeaveScheduleImpact[]
		bookings: LeaveBookingImpact[]
		open_slots: LeaveOpenSlotImpact[]
	}
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

export const staffLeaveRequestDetailQuery = (id: string | null) =>
	queryOptions({
		queryKey: ["admin", "leave-requests", "detail", id],
		queryFn: () => api.get(`admin/leave-requests/${id}`).json<ApiResponse<StaffLeaveRequestDetail>>(),
		enabled: id !== null,
		staleTime: 15_000,
	})

export const teacherDayScheduleQuery = (teacherId: string | null, date: string | null) =>
	queryOptions({
		queryKey: ["admin", "teachers", teacherId, "day-schedule", date],
		queryFn: () =>
			api
				.get(`admin/teachers/${teacherId}/day-schedule?date=${encodeURIComponent(date ?? "")}`)
				.json<ApiResponse<TeacherDaySchedule>>(),
		enabled: teacherId !== null && date !== null,
		staleTime: 15_000,
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

export function useRescheduleLeaveBooking() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ bookingId, targetSlotId }: { bookingId: string; targetSlotId: string }) =>
			api
				.post(`admin/bookings/${bookingId}/reschedule`, { json: { target_slot_id: targetSlotId } })
				.json<ApiResponse<unknown>>(),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin", "leave-requests"] })
			qc.invalidateQueries({ queryKey: ["admin", "courses", "slots"] })
			qc.invalidateQueries({ queryKey: ["admin", "courses", "bookings"] })
		},
	})
}

export function useCancelLeaveBooking() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (bookingId: string) =>
			api.post(`admin/bookings/${bookingId}/cancel`).json<ApiResponse<unknown>>(),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin", "leave-requests"] })
			qc.invalidateQueries({ queryKey: ["admin", "courses", "slots"] })
			qc.invalidateQueries({ queryKey: ["admin", "courses", "bookings"] })
		},
	})
}

export function useRescheduleLeaveScheduleItem() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
			api
				.patch(`admin/schedule-items/${id}`, { json: { ...input, notify_learners: true } })
				.json<ApiResponse<unknown>>(),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "leave-requests"] }),
	})
}

export function useCancelLeaveScheduleItem() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, reason }: { id: string; reason: string }) =>
			api.post(`admin/schedule-items/${id}/cancel`, { json: { reason } }).json<ApiResponse<unknown>>(),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "leave-requests"] }),
	})
}

export function useRescheduleLeaveOpenSlot() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({
			id,
			startsAt,
			durationMinutes,
		}: {
			id: string
			startsAt: string
			durationMinutes: number
		}) =>
			api
				.patch(`admin/slots/${id}`, { json: { starts_at: startsAt, duration_minutes: durationMinutes } })
				.json<ApiResponse<unknown>>(),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin", "leave-requests"] })
			qc.invalidateQueries({ queryKey: ["admin", "courses", "slots"] })
		},
	})
}

export function useDeleteLeaveOpenSlot() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/slots/${id}`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin", "leave-requests"] })
			qc.invalidateQueries({ queryKey: ["admin", "courses", "slots"] })
		},
	})
}
