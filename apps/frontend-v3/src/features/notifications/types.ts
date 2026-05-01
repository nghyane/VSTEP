/**
 * Notification types BE phát ra (xem app/Listeners + Services/{TopupService,CourseService,CourseOrderService}).
 * Phải đồng bộ thủ công với BE — chưa có shared schema.
 */
export type NotificationType =
	| "topup_completed"
	| "coin_received"
	| "grading_completed"
	| "grading_failed"
	| "course_enrolled"
	| "booking_created"

export interface Notification {
	id: string
	// Cho phép string lạ để FE không vỡ khi BE thêm type mới — render fallback visual.
	type: NotificationType | (string & {})
	title: string
	body: string | null
	icon_key: string | null
	payload: Record<string, unknown> | null
	read_at: string | null
	created_at: string
}

export interface UnreadCount {
	count: number
}

export interface ReadAllResult {
	marked: number
}
