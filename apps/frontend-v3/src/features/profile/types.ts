import type { AvatarKey, Profile } from "#/types/auth"

export interface CreateProfileInput {
	nickname: string
	entry_level: string
	target_level: string
	target_deadline: string
}

export interface UpdateProfileInput {
	nickname?: string
	target_deadline?: string
}

export interface AvatarResponse {
	avatar_key: AvatarKey | null
	avatar_url: string | null
}

export interface ProfileCardProps {
	profile: Profile
	isActive: boolean
	onSwitch: () => void
	onEdit: () => void
}
