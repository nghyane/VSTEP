import type { CreateProfileInput, UpdateProfileInput } from "#/features/profile/types"
import { type ApiResponse, api } from "#/lib/api"
import type { AvatarKey, Profile } from "#/types/auth"

export async function createProfile(input: CreateProfileInput) {
	return api.post("profiles", { json: input }).json<ApiResponse<Profile>>()
}

export async function updateProfile(id: string, input: UpdateProfileInput) {
	return api.patch(`profiles/${id}`, { json: input }).json<ApiResponse<Profile>>()
}

export async function updateAvatar(avatar_key: AvatarKey) {
	return api
		.patch("me/avatar", { json: { avatar_key } })
		.json<ApiResponse<{ avatar_key: AvatarKey; avatar_url: null }>>()
}

export async function uploadAvatar(file: File) {
	const body = new FormData()
	body.append("avatar", file)
	return api.post("me/avatar", { body }).json<ApiResponse<{ avatar_url: string; avatar_key: null }>>()
}
