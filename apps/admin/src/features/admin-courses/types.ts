export const COURSE_TARGET_LEVELS = ["B1", "B2", "C1"] as const
export type CourseTargetLevel = (typeof COURSE_TARGET_LEVELS)[number]

export interface TeacherOption {
	id: string
	full_name: string
	email: string
}

export interface AdminCourse {
	id: string
	slug: string
	title: string
	target_level: CourseTargetLevel
	target_exam_school: string | null
	description: string | null
	rules: string | null
	price_coins: number
	bonus_coins: number
	price_vnd: number
	original_price_vnd: number | null
	max_slots: number
	max_slots_per_student: number
	start_date: string
	end_date: string
	required_full_tests: number
	commitment_window_days: number
	livestream_url: string | null
	teacher_id: string
	teacher?: TeacherOption
	is_published: boolean
	enrollment_count?: number
	schedule_item_count?: number
	created_at: string
	updated_at: string
}

export interface CourseFormInput {
	slug: string
	title: string
	target_level: CourseTargetLevel
	target_exam_school: string | null
	description: string | null
	rules: string | null
	bonus_coins: number
	price_vnd: number
	original_price_vnd: number | null
	max_slots: number
	max_slots_per_student: number
	start_date: string
	end_date: string
	required_full_tests: number
	commitment_window_days: number
	livestream_url: string | null
	teacher_id: string
	is_published: boolean
}

export interface CourseListFilters {
	page?: number
	per_page?: number
	q?: string
	is_published?: "all" | "yes" | "no"
	target_level?: CourseTargetLevel | ""
	teacher_id?: string
}

export interface AdminScheduleItem {
	id: string
	course_id: string
	session_number: number
	date: string // YYYY-MM-DD
	start_time: string // HH:mm
	end_time: string // HH:mm
	topic: string
}

export interface ScheduleItemFormInput {
	session_number?: number | null
	date: string
	start_time: string
	end_time: string
	topic: string
}

export interface ProfilePickerItem {
	id: string
	nickname: string | null
	target_level: string | null
	target_deadline: string | null
	is_enrolled: boolean
}

export interface UserPickerResult {
	id: string
	display_name: string | null
	email: string
	profiles: ProfilePickerItem[]
}

export interface AdminEnrollment {
	id: string
	enrolled_at: string
	coins_paid: number
	bonus_coins_received: number
	acknowledged_commitment: boolean
	commitment_signature: string | null
	profile: {
		id: string
		nickname: string | null
		target_level: string | null
		target_deadline: string | null
	} | null
	account: {
		id: string
		full_name: string
		email: string
	} | null
}
