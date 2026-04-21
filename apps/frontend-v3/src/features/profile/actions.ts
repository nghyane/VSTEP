import type { CreateProfileInput } from "#/features/profile/types"
import { type ApiResponse, api } from "#/lib/api"
import type { Profile } from "#/types/auth"

export async function createProfile(input: CreateProfileInput) {
	return api.post("profiles", { json: input }).json<ApiResponse<Profile>>()
}
