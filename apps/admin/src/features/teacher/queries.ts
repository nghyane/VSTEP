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
	status: "open" | "booked"
	course: { id: string; title: string } | null
	bookings: Array<{
		id: string
		status: string
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

export interface TeacherLeaveRequestItem {
	id: string
	date: string
	reason: string | null
	status: "pending" | "approved" | "rejected"
	reviewed_at: string | null
	created_at: string
}

const get = <T>(path: string) => api.get(path).json<ApiResponse<T>>()

export const useTeacherDashboard = () =>
	useQuery({
		queryKey: ["teacher", "dashboard"],
		queryFn: () => get<TeacherDashboardData>("admin/teacher/dashboard"),
		select: (r) => r.data,
		staleTime: 60_000,
	})

export const useTeacherSlots = (from?: string, to?: string) =>
	useQuery({
		queryKey: ["teacher", "slots", { from, to }],
		queryFn: () => {
			const params = new URLSearchParams()
			if (from) params.set("from", from)
			if (to) params.set("to", to)
			const qs = params.toString()
			return get<{ data: TeacherSlotItem[] }>(`admin/teacher/slots${qs ? `?${qs}` : ""}`)
		},
		select: (r) => r.data.data,
		staleTime: 60_000,
	})

export const useTeacherBookings = (status?: string) =>
	useQuery({
		queryKey: ["teacher", "bookings", { status }],
		queryFn: () => {
			const qs = status ? `?status=${status}` : ""
			return get<{ data: TeacherBookingItem[] }>(`admin/teacher/bookings${qs}`)
		},
		select: (r) => r.data.data,
		staleTime: 60_000,
	})

export const useTeacherLeaveRequests = () =>
	useQuery({
		queryKey: ["teacher", "leave-requests"],
		queryFn: () => get<{ data: TeacherLeaveRequestItem[] }>("admin/teacher/leave-requests"),
		select: (r) => r.data.data,
		staleTime: 60_000,
	})

export const useCreateLeaveRequest = () => {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (data: { date: string; reason?: string }) =>
			api.post("admin/teacher/leave-requests", { json: data }).json(),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["teacher", "leave-requests"] })
			qc.invalidateQueries({ queryKey: ["teacher", "dashboard"] })
		},
	})
}
