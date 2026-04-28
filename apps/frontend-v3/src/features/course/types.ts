export interface CourseScheduleItem {
	id: string
	session_number: number
	date: string
	start_time: string
	end_time: string
	topic: string
}

export interface CourseTeacher {
	id: string
	full_name: string
	title?: string | null
	bio?: string | null
}

export const COURSE_LEVEL_LABELS: Record<string, string> = {
	B1: "B1 · Trung cấp",
	B2: "B2 · Trên trung cấp",
	C1: "C1 · Cao cấp",
}

export interface Course {
	id: string
	slug: string
	title: string
	target_level: string
	target_exam_school: string | null
	description: string | null
	price_vnd: number
	original_price_vnd: number | null
	bonus_coins: number
	max_slots: number
	start_date: string
	end_date: string
	required_full_tests: number
	commitment_window_days: number
	livestream_url: string | null
	teacher: CourseTeacher | null
	sold_slots?: number
	schedule_items_count?: number
}

export interface CourseWithRelations extends Course {
	schedule_items: CourseScheduleItem[]
}

export interface CourseDetail {
	course: CourseWithRelations
	sold_slots: number
	commitment: CommitmentStatus | null
}

export interface CommitmentStatus {
	phase: "not_enrolled" | "pending" | "met"
	completed: number
	required: number
}

export interface CourseListResponse {
	data: Course[]
	enrolled_course_ids: string[]
}
