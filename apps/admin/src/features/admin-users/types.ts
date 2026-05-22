export const USER_ROLES = ["learner", "teacher", "staff", "admin"] as const
export type UserRole = (typeof USER_ROLES)[number]

// Admin chỉ được tạo learner/teacher/staff. Role admin chỉ super-admin
// seed qua DB.
export const CREATABLE_ROLES = ["learner", "teacher", "staff"] as const
export type CreatableRole = (typeof CREATABLE_ROLES)[number]

export const ROLE_LABELS: Record<UserRole, string> = {
	learner: "Học viên",
	teacher: "Giáo viên",
	staff: "Nhân viên",
	admin: "Quản trị viên",
}

export interface AdminUser {
	id: string
	email: string
	full_name: string | null
	role: UserRole
	avatar_key: string | null
	title: string | null
	bio: string | null
	deactivated_at: string | null
	created_at: string
}

export interface UserActiveCourse {
	id: string
	title: string
	slug: string
	start_date: string
	end_date: string
}

export interface AdminUserDetail extends AdminUser {
	active_courses?: UserActiveCourse[]
}

export interface UserListFilters {
	page?: number
	per_page?: number
	q?: string
	role?: UserRole | ""
}

export interface CreateUserInput {
	email: string
	password: string
	role: CreatableRole
	full_name?: string | null
	title?: string | null
	bio?: string | null
}

export interface UpdateUserInput {
	full_name?: string | null
	title?: string | null
	bio?: string | null
	avatar_key?: string | null
}

export interface ReassignmentInput {
	course_id: string
	new_teacher_id: string
}
