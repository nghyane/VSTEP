import { type ApiResponse, api } from "#/lib/api"

interface EnrollmentOrder {
	id: string
	course_id: string
	status: string
	amount_vnd: number
	paid_at: string | null
}

/**
 * Enroll flow của BE là 2-step (xem CourseController):
 * 1) tạo pending order → 2) confirm mock payment → tạo enrollment + credit bonus xu.
 * Wrap thành 1 promise để FE caller chỉ cần `mutate()`.
 */
export async function enrollCourse(courseId: string) {
	const create = await api.post(`courses/${courseId}/enrollment-orders`).json<ApiResponse<EnrollmentOrder>>()
	return api.post(`courses/enrollment-orders/${create.data.id}/confirm`).json<ApiResponse<EnrollmentOrder>>()
}
