export interface User {
	id: string
	email: string
	role: string
}

export interface Profile {
	id: string
	nickname: string
	target_level: string | null
}
