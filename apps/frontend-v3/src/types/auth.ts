export interface User {
	id: string
	email: string
	role: string
}

export interface Profile {
	id: string
	nickname: string
	target_level: string
	target_deadline: string
	avatar_color: string | null
	is_initial_profile: boolean
	created_at: string
}
