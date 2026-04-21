import { api, type ApiResponse } from "#/lib/api"
import type { Profile } from "#/types/auth"
import type { CreateProfileInput, SwitchProfileResponse } from "#/features/profile/types"

export async function switchProfile(profileId: string, refreshToken: string) {
	return api
		.post("auth/switch-profile", { json: { profile_id: profileId, refresh_token: refreshToken } })
		.json<ApiResponse<SwitchProfileResponse>>()
}

export async function createProfile(input: CreateProfileInput) {
	return api.post("profiles", { json: input }).json<ApiResponse<Profile>>()
}
