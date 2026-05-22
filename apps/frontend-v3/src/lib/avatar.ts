import type { AvatarKey, User } from "#/types/auth"

const BG_COLORS = "b6e3f4,ffd5dc,c0aede,ffdfbf"

export const AVATAR_PRESETS: { key: AvatarKey }[] = [
	{ key: "Alex" },
	{ key: "Jordan" },
	{ key: "Sam" },
	{ key: "Riley" },
	{ key: "Casey" },
	{ key: "Morgan" },
	{ key: "Taylor" },
	{ key: "Drew" },
	{ key: "Quinn" },
	{ key: "Avery" },
	{ key: "Blake" },
	{ key: "Cameron" },
	{ key: "Dakota" },
	{ key: "Emery" },
	{ key: "Finley" },
	{ key: "Hayden" },
	{ key: "Indigo" },
	{ key: "Jesse" },
	{ key: "Kai" },
	{ key: "Logan" },
	{ key: "Mason" },
	{ key: "Noah" },
	{ key: "Oakley" },
	{ key: "Parker" },
	{ key: "Reese" },
	{ key: "Sage" },
	{ key: "Skyler" },
	{ key: "Tatum" },
	{ key: "Winter" },
	{ key: "Zion" },
]

export function getUserAvatarSrc(user: Pick<User, "avatar_key" | "avatar_url">): string | null {
	if (user.avatar_url) return user.avatar_url
	if (user.avatar_key) return getAvatarUrl(user.avatar_key)
	return null
}

/** Trích tên riêng từ display name của SpeechSynthesisVoice */
export function extractFirstName(displayName: string): string {
	return displayName.split(/\s*[-–(]\s*/)[0].trim()
}

/** Lấy URL avatar DiceBear nhất quán theo tên */
export function getAvatarUrl(name: string): string {
	const firstName = extractFirstName(name)
	return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(firstName)}&backgroundColor=${BG_COLORS}&backgroundType=solid`
}
