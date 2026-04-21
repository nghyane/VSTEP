import type { Profile } from "#/types/auth"

export interface SwitchProfileResponse {
	access_token: string
	refresh_token: string
	expires_in: number
	profile: Profile
}

export interface CreateProfileInput {
	nickname: string
	target_level: string
	target_deadline: string
}
