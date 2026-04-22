import type { Profile } from "#/types/auth"

export interface CreateProfileInput {
	nickname: string
	target_level: string
	target_deadline: string
}

export interface UpdateProfileInput {
	nickname?: string
	target_deadline?: string
}

export interface ProfileCardProps {
	profile: Profile
	isActive: boolean
	onSwitch: () => void
	onEdit: () => void
}
