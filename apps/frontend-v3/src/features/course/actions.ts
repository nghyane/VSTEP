import type { EnrollResult } from "#/features/course/types"
import { type ApiResponse, api } from "#/lib/api"

export async function enrollCourse(courseId: string) {
	return api.post(`courses/${courseId}/enroll`).json<ApiResponse<EnrollResult>>()
}
