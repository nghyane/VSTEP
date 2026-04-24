const KEYS = {
	refresh: "vstep_refresh_token",
	user: "vstep_user",
} as const

let _accessToken: string | null = null

export const tokens = {
	getAccess: () => _accessToken,
	setAccess: (token: string) => {
		_accessToken = token
	},

	getRefresh: () => localStorage.getItem(KEYS.refresh),
	setRefresh: (token: string) => localStorage.setItem(KEYS.refresh, token),

	getUser: () => {
		const raw = localStorage.getItem(KEYS.user)
		return raw ? JSON.parse(raw) : null
	},
	setUser: (user: unknown) => localStorage.setItem(KEYS.user, JSON.stringify(user)),

	clear: () => {
		_accessToken = null
		for (const key of Object.values(KEYS)) localStorage.removeItem(key)
	},
}
