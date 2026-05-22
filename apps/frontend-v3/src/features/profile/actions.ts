import type { CreateProfileInput, UpdateProfileInput } from "#/features/profile/types"
import { type ApiResponse, api } from "#/lib/api"
import type { Profile } from "#/types/auth"

export async function createProfile(input: CreateProfileInput) {
	return api.post("profiles", { json: input }).json<ApiResponse<Profile>>()
}

export async function updateProfile(id: string, input: UpdateProfileInput) {
	return api.patch(`profiles/${id}`, { json: input }).json<ApiResponse<Profile>>()
}

export async function changePassword(input: { current_password: string; new_password: string }) {
	return api.post("me/change-password", { json: input }).json<ApiResponse<{ success: boolean }>>()
}
