import { api, type ApiResponse } from "#/lib/api"
import { tokens } from "#/lib/tokens"
import { useAuth } from "#/lib/auth"
import type { Profile } from "#/types/auth"

interface SwitchResponse {
	access_token: string
	refresh_token: string
	expires_in: number
	profile: Profile
}

export async function switchProfile(profileId: string, refreshToken: string) {
	const { data } = await api
		.post("auth/switch-profile", { json: { profile_id: profileId, refresh_token: refreshToken } })
		.json<ApiResponse<SwitchResponse>>()

	tokens.setAccess(data.access_token)
	tokens.setRefresh(data.refresh_token)
	tokens.setProfile(data.profile)
	useAuth.setState({ profile: data.profile })
}

export async function createProfile(input: { nickname: string; target_level: string; target_deadline: string }) {
	const { data } = await api.post("profiles", { json: input }).json<{ data: Profile }>()
	return data
}
