const KEYS = {
	access: "vstep_access_token",
	refresh: "vstep_refresh_token",
	user: "vstep_user",
	profile: "vstep_profile",
} as const

export const tokenStorage = {
	getAccess: () => localStorage.getItem(KEYS.access),
	setAccess: (token: string) => localStorage.setItem(KEYS.access, token),

	getRefresh: () => localStorage.getItem(KEYS.refresh),
	setRefresh: (token: string) => localStorage.setItem(KEYS.refresh, token),

	getUser: () => {
		const raw = localStorage.getItem(KEYS.user)
		return raw ? JSON.parse(raw) : null
	},
	setUser: (user: unknown) => localStorage.setItem(KEYS.user, JSON.stringify(user)),

	getProfile: () => {
		const raw = localStorage.getItem(KEYS.profile)
		return raw ? JSON.parse(raw) : null
	},
	setProfile: (profile: unknown) => localStorage.setItem(KEYS.profile, JSON.stringify(profile)),

	clear: () => {
		for (const key of Object.values(KEYS)) localStorage.removeItem(key)
	},
}
