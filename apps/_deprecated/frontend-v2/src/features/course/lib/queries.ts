import { queryOptions } from "@tanstack/react-query"
import { mockFetchCourse, mockFetchCourses } from "#/mocks/courses"

export const courseKeys = {
	all: ["courses"] as const,
	list: () => [...courseKeys.all, "list"] as const,
	detail: (id: string) => [...courseKeys.all, "detail", id] as const,
}

export const courseListQueryOptions = () =>
	queryOptions({
		queryKey: courseKeys.list(),
		queryFn: mockFetchCourses,
		staleTime: 1000 * 60 * 5,
	})

export const courseDetailQueryOptions = (id: string) =>
	queryOptions({
		queryKey: courseKeys.detail(id),
		queryFn: () => mockFetchCourse(id),
		staleTime: 1000 * 60 * 5,
	})
