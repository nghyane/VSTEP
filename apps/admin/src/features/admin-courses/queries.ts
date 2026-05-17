import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
	AdminCourse,
	CourseFormInput,
	CourseListFilters,
	TeacherOption,
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
