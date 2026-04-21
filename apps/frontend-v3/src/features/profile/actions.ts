import { api, type ApiResponse } from "#/lib/api"
import type { Profile } from "#/types/auth"
import type { CreateProfileInput } from "#/features/profile/types"

export async function createProfile(input: CreateProfileInput) {
	return api.post("profiles", { json: input }).json<ApiResponse<Profile>>()
}
