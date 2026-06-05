import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
	AdminCourse,
	AdminEnrollment,
	AdminScheduleItem,
	AdminTeacherBooking,
	AdminTeacherSlot,
	BulkSlotsInput,
	CourseFormInput,
	CourseListFilters,
	ScheduleItemFormInput,
	SlotFormInput,
	TeacherOption,
	UserPickerResult,
} from "#/features/admin-courses/types"
import { type ApiResponse, api, type PaginatedResponse } from "#/lib/api"

function buildSearch(filters: CourseListFilters): string {
	const params = new URLSearchParams()
	if (filters.page) params.set("page", String(filters.page))
	if (filters.per_page) params.set("per_page", String(filters.per_page))
	if (filters.q) params.set("q", filters.q)
	if (filters.is_published === "yes") params.set("is_published", "1")
	if (filters.is_published === "no") params.set("is_published", "0")
	if (filters.target_level) params.set("target_level", filters.target_level)
	if (filters.teacher_id) params.set("teacher_id", filters.teacher_id)
	const qs = params.toString()
	return qs ? `?${qs}` : ""
}

export const courseListQuery = (filters: CourseListFilters) =>
	queryOptions({
		queryKey: ["admin", "courses", "list", filters],
		queryFn: () => api.get(`admin/courses${buildSearch(filters)}`).json<PaginatedResponse<AdminCourse>>(),
		staleTime: 30_000,
	})

export const courseDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["admin", "courses", "detail", id],
		queryFn: () => api.get(`admin/courses/${id}`).json<ApiResponse<AdminCourse>>(),
	})

export const teacherOptionsQuery = () =>
	queryOptions({
		queryKey: ["admin", "users", "teachers"],
		queryFn: () => api.get("admin/users/teachers").json<ApiResponse<TeacherOption[]>>(),
		staleTime: 5 * 60_000,
	})

function invalidateList(qc: ReturnType<typeof useQueryClient>): void {
	qc.invalidateQueries({ queryKey: ["admin", "courses", "list"] })
	// Course mutations (publish/unpublish, create, delete, update end_date) đều có thể
	// thay đổi alert "khóa expired vẫn đang published" → invalidate luôn để banner +
	// bell Topbar không phải F5 mới đồng bộ.
	qc.invalidateQueries({ queryKey: ["admin", "alerts"] })
}

function invalidateDetail(qc: ReturnType<typeof useQueryClient>, id: string): void {
	qc.invalidateQueries({ queryKey: ["admin", "courses", "detail", id] })
}

export function useCreateCourse() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: CourseFormInput) =>
			api.post("admin/courses", { json: input }).json<ApiResponse<AdminCourse>>(),
		onSuccess: () => invalidateList(qc),
	})
}

export function useUpdateCourse(id: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: Partial<CourseFormInput>) =>
			api.patch(`admin/courses/${id}`, { json: input }).json<ApiResponse<AdminCourse>>(),
		onSuccess: () => {
			invalidateList(qc)
			invalidateDetail(qc, id)
			// Update end_date/start_date ảnh hưởng đến slots hiển thị → invalidate luôn.
			invalidateSlots(qc, id)
		},
	})
}

export function useDeleteCourse() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/courses/${id}`),
		onSuccess: () => invalidateList(qc),
	})
}

export function useSetCoursePublished() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, published }: { id: string; published: boolean }) =>
			api.post(`admin/courses/${id}/${published ? "publish" : "unpublish"}`).json<ApiResponse<AdminCourse>>(),
		onSuccess: (_d, { id }) => {
			invalidateList(qc)
			invalidateDetail(qc, id)
		},
	})
}

// ─── Schedule items ──────────────────────────────────────

export const scheduleItemsQuery = (courseId: string) =>
	queryOptions({
		queryKey: ["admin", "courses", "schedule-items", courseId],
		queryFn: () =>
			api.get(`admin/courses/${courseId}/schedule-items`).json<ApiResponse<AdminScheduleItem[]>>(),
	})

function invalidateScheduleItems(qc: ReturnType<typeof useQueryClient>, courseId: string): void {
	qc.invalidateQueries({ queryKey: ["admin", "courses", "schedule-items", courseId] })
	invalidateDetail(qc, courseId)
}

export function useCreateScheduleItem(courseId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: ScheduleItemFormInput) =>
			api
				.post(`admin/courses/${courseId}/schedule-items`, { json: input })
				.json<ApiResponse<AdminScheduleItem>>(),
		onSuccess: () => invalidateScheduleItems(qc, courseId),
	})
}

export function useUpdateScheduleItem(courseId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: Partial<ScheduleItemFormInput> }) =>
			api.patch(`admin/schedule-items/${id}`, { json: input }).json<ApiResponse<AdminScheduleItem>>(),
		onSuccess: () => invalidateScheduleItems(qc, courseId),
	})
}

export function useDeleteScheduleItem(courseId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/schedule-items/${id}`),
		onSuccess: () => invalidateScheduleItems(qc, courseId),
	})
}

// ─── Enrollments (read-only) ─────────────────────────────

export const enrollmentsQuery = (courseId: string, page: number) =>
	queryOptions({
		queryKey: ["admin", "courses", "enrollments", courseId, page],
		queryFn: () =>
			api
				.get(`admin/courses/${courseId}/enrollments?page=${page}&per_page=20`)
				.json<PaginatedResponse<AdminEnrollment>>(),
		staleTime: 30_000,
	})

function invalidateEnrollments(qc: ReturnType<typeof useQueryClient>, courseId: string): void {
	// Bất kể page nào — invalidate theo prefix [admin, courses, enrollments, courseId].
	qc.invalidateQueries({ queryKey: ["admin", "courses", "enrollments", courseId] })
	// Course detail có enrollment_count → invalidate luôn.
	invalidateDetail(qc, courseId)
}

export const profileSearchQuery = (q: string, courseId: string) =>
	queryOptions({
		queryKey: ["admin", "profiles", "search", courseId, q],
		queryFn: () => {
			const params = new URLSearchParams({ course_id: courseId, q })
			return api.get(`admin/profiles/search?${params.toString()}`).json<ApiResponse<UserPickerResult[]>>()
		},
		staleTime: 10_000,
	})

export function useCreateEnrollment(courseId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (profileId: string) =>
			api
				.post(`admin/courses/${courseId}/enrollments`, { json: { profile_id: profileId } })
				.json<ApiResponse<AdminEnrollment>>(),
		onSuccess: () => {
			invalidateEnrollments(qc, courseId)
			qc.invalidateQueries({ queryKey: ["admin", "profiles", "search", courseId] })
		},
	})
}

export function useDeleteEnrollment(courseId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/enrollments/${id}`),
		onSuccess: () => invalidateEnrollments(qc, courseId),
	})
}

export function useSetEnrollmentCommitment(courseId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, acknowledged }: { id: string; acknowledged: boolean }) =>
			api
				.patch(`admin/enrollments/${id}/commitment`, {
					json: { acknowledged_commitment: acknowledged },
				})
				.json<ApiResponse<AdminEnrollment>>(),
		onSuccess: () => invalidateEnrollments(qc, courseId),
	})
}

// ─── Teacher slots ───────────────────────────────────────

export const slotsQuery = (courseId: string, page: number) =>
	queryOptions({
		queryKey: ["admin", "courses", "slots", courseId, page],
		queryFn: () =>
			api
				.get(`admin/courses/${courseId}/slots?page=${page}&per_page=10`)
				.json<PaginatedResponse<AdminTeacherSlot>>(),
		staleTime: 15_000,
		// Tab "Lịch 1-1" mount/unmount khi chuyển tab — luôn refetch khi mount lại
		// để đảm bảo data đồng bộ sau khi update course hoặc tạo slot từ tab khác.
		refetchOnMount: "always",
	})

function invalidateSlots(qc: ReturnType<typeof useQueryClient>, courseId: string): void {
	qc.invalidateQueries({ queryKey: ["admin", "courses", "slots", courseId] })
}

export function useCreateSlot(courseId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: SlotFormInput) =>
			api.post(`admin/courses/${courseId}/slots`, { json: input }).json<ApiResponse<AdminTeacherSlot>>(),
		onSuccess: () => invalidateSlots(qc, courseId),
	})
}

export function useBulkCreateSlots(courseId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: BulkSlotsInput) =>
			api
				.post(`admin/courses/${courseId}/slots/bulk`, { json: input })
				.json<ApiResponse<{ created: number; skipped: number }>>(),
		onSuccess: () => invalidateSlots(qc, courseId),
	})
}

export function useUpdateSlot(courseId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: Partial<SlotFormInput> }) =>
			api.patch(`admin/slots/${id}`, { json: input }).json<ApiResponse<AdminTeacherSlot>>(),
		onSuccess: () => invalidateSlots(qc, courseId),
	})
}

export function useDeleteSlot(courseId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/slots/${id}`),
		onSuccess: () => invalidateSlots(qc, courseId),
	})
}

// ─── Teacher bookings (admin) ────────────────────────────

export const bookingsQuery = (
	courseId: string,
	page: number,
	filters?: { status?: string; search?: string; sort?: string; direction?: string },
) =>
	queryOptions({
		queryKey: ["admin", "courses", "bookings", courseId, page, filters],
		queryFn: () => {
			const params = new URLSearchParams({ page: String(page), per_page: "20" })
			if (filters?.status) params.set("status", filters.status)
			if (filters?.search) params.set("search", filters.search)
			if (filters?.sort) params.set("sort", filters.sort)
			if (filters?.direction) params.set("direction", filters.direction)
			return api
				.get(`admin/courses/${courseId}/bookings?${params}`)
				.json<PaginatedResponse<AdminTeacherBooking>>()
		},
		staleTime: 15_000,
	})

function invalidateBookingsAndSlots(qc: ReturnType<typeof useQueryClient>, courseId: string): void {
	// Cancel booking thay đổi cả slot status (booked→open), nên invalidate luôn slot tab.
	qc.invalidateQueries({ queryKey: ["admin", "courses", "bookings", courseId] })
	invalidateSlots(qc, courseId)
}

export function useUpdateBookingMeetUrl(courseId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, meetUrl }: { id: string; meetUrl: string | null }) =>
			api
				.patch(`admin/bookings/${id}`, { json: { meet_url: meetUrl } })
				.json<ApiResponse<AdminTeacherBooking>>(),
		onSuccess: () => invalidateBookingsAndSlots(qc, courseId),
	})
}

export function useCancelBooking(courseId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			api.post(`admin/bookings/${id}/cancel`).json<ApiResponse<AdminTeacherBooking>>(),
		onSuccess: () => invalidateBookingsAndSlots(qc, courseId),
	})
}
