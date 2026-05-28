import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type ApiResponse, api } from "#/lib/api"

export interface TeacherDashboardData {
	today_slots: number
	upcoming_bookings: number
	pending_leaves: number
}

export interface TeacherSlotItem {
	id: string
	starts_at: string
	duration_minutes: number
	status: "open" | "booked" | "completed" | "cancelled"
	course: { id: string; title: string } | null
	bookings: Array<{
		id: string
		status: string
		meet_url: string | null
		profile: { id: string; account: { id: string; full_name: string } | null } | null
	}>
}

export interface TeacherBookingItem {
	id: string
	status: "booked" | "completed" | "cancelled"
	booked_at: string
	cancelled_at: string | null
	meet_url: string | null
	slot: {
		id: string
		starts_at: string
		duration_minutes: number
		course: { id: string; title: string } | null
	} | null
	profile: { id: string; account: { id: string; full_name: string } | null } | null
}

export interface TeacherScheduleItem {
	id: string
	course_id: string
	session_number: number
	date: string
	start_time: string
	end_time: string
	topic: string
	course: { id: string; title: string; livestream_url: string | null } | null
}

export interface TeacherLeaveRequestItem {
	id: string
	date: string
	reason: string | null
	status: "pending" | "approved" | "rejected"
	reviewed_at: string | null
	created_at: string
}

const get = <T>(path: string) => api.get(path).json<ApiResponse<T>>()

const TEACHER_STALE_MS = 60_000

export const useTeacherDashboard = () =>
	useQuery({
		queryKey: ["teacher", "dashboard"],
		queryFn: () => get<TeacherDashboardData>("teacher/dashboard"),
		select: (r) => r.data,
		staleTime: TEACHER_STALE_MS,
	})

export const useTeacherSlots = (from?: string, to?: string) =>
	useQuery({
		queryKey: ["teacher", "slots", { from, to }],
		queryFn: () => {
			const params = new URLSearchParams()
			if (from) params.set("from", from)
			if (to) params.set("to", to)
			const qs = params.toString()
			return get<{ data: TeacherSlotItem[] }>(`teacher/slots${qs ? `?${qs}` : ""}`)
		},
		select: (r) => r.data.data,
		staleTime: TEACHER_STALE_MS,
	})

export const useTeacherScheduleItems = (from?: string, to?: string) =>
	useQuery({
		queryKey: ["teacher", "schedule-items", { from, to }],
		queryFn: () => {
			const params = new URLSearchParams()
			if (from) params.set("from", from)
			if (to) params.set("to", to)
			const qs = params.toString()
			return get<TeacherScheduleItem[]>(`teacher/schedule-items${qs ? `?${qs}` : ""}`)
		},
		select: (r) => r.data,
		staleTime: TEACHER_STALE_MS,
	})

export const useTeacherBookings = (status?: string) =>
	useQuery({
		queryKey: ["teacher", "bookings", { status }],
		queryFn: () => {
			const qs = status ? `?status=${status}` : ""
			return get<{ data: TeacherBookingItem[] }>(`teacher/bookings${qs}`)
		},
		select: (r) => r.data.data,
		staleTime: TEACHER_STALE_MS,
	})

export const useTeacherLeaveRequests = () =>
	useQuery({
		queryKey: ["teacher", "leave-requests"],
		queryFn: () => get<{ data: TeacherLeaveRequestItem[] }>("teacher/leave-requests"),
		select: (r) => r.data.data,
		staleTime: TEACHER_STALE_MS,
	})

export const useCreateLeaveRequest = () => {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (data: { date: string; reason?: string }) =>
			api.post("teacher/leave-requests", { json: data }).json(),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["teacher", "leave-requests"] })
			qc.invalidateQueries({ queryKey: ["teacher", "dashboard"] })
		},
	})
}
