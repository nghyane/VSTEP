import { queryOptions } from "@tanstack/react-query"
import type { CourseDetail, CourseListResponse } from "#/features/course/types"
import { type ApiResponse, api } from "#/lib/api"

export const courseListQuery = queryOptions({
	queryKey: ["courses"],
	queryFn: () => api.get("courses").json<CourseListResponse>(),
})

export const courseDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["courses", id],
		queryFn: () => api.get(`courses/${id}`).json<ApiResponse<CourseDetail>>(),
	})
