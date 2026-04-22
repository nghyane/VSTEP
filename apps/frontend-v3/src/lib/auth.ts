import { create } from "zustand"
import { type ApiResponse, api } from "#/lib/api"
import { tokens } from "#/lib/tokens"
import type { Profile, User } from "#/types/auth"

interface AuthResponse {
	access_token: string
	refresh_token: string
	user: User
	profile: Profile
}

interface RefreshResponse {
	access_token: string
	refresh_token: string
	profile: Profile | null
}

interface SwitchResponse {
	access_token: string
	refresh_token: string
	profile: Profile
}

type AuthState =
	| { status: "idle" }
	| { status: "authenticated"; user: User; profile: Profile }
	| { status: "unauthenticated" }

type AuthActions = {
	login: (email: string, password: string) => Promise<void>
	register: (data: {
		email: string
		password: string
		nickname: string
		target_level: string
		target_deadline: string
	}) => Promise<void>
	switchProfile: (profileId: string) => Promise<void>
	logout: () => void
	_setAuthenticated: (user: User, profile: Profile) => void
	_setUnauthenticated: () => void
}

type AuthStore = AuthState & AuthActions

export const useAuth = create<AuthStore>()((set, get) => ({
	status: "idle",

	_setAuthenticated: (user, profile) => set({ status: "authenticated", user, profile }),
	_setUnauthenticated: () => set({ status: "unauthenticated" }),

	async login(email, password) {
		const { data } = await api
			.post("auth/login", { json: { email, password } })
			.json<ApiResponse<AuthResponse>>()
		tokens.setAccess(data.access_token)
		tokens.setRefresh(data.refresh_token)
		tokens.setUser(data.user)
		set({ status: "authenticated", user: data.user, profile: data.profile })
	},

	async register(input) {
		const { data } = await api.post("auth/register", { json: input }).json<ApiResponse<AuthResponse>>()
		tokens.setAccess(data.access_token)
		tokens.setRefresh(data.refresh_token)
		tokens.setUser(data.user)
		set({ status: "authenticated", user: data.user, profile: data.profile })
	},

	async switchProfile(profileId) {
		const refreshToken = tokens.getRefresh()
		if (!refreshToken) throw new Error("No refresh token")
		const { data } = await api
			.post("auth/switch-profile", {
				json: { profile_id: profileId, refresh_token: refreshToken },
			})
			.json<ApiResponse<SwitchResponse>>()
		tokens.setAccess(data.access_token)
		tokens.setRefresh(data.refresh_token)
		const state = get()
		if (state.status === "authenticated") {
			set({ status: "authenticated", user: state.user, profile: data.profile })
		}
	},

	logout() {
		tokens.clear()
		set({ status: "unauthenticated" })
	},
}))

export function useSession() {
	const state = useAuth()
	if (state.status !== "authenticated") throw new Error("useSession used outside authenticated context")
	return { user: state.user, profile: state.profile }
}

export async function initAuth() {
	const refreshToken = tokens.getRefresh()
	if (!refreshToken) {
		useAuth.getState()._setUnauthenticated()
		return
	}
	try {
		const { data } = await api
			.post("auth/refresh", { json: { refresh_token: refreshToken } })
			.json<ApiResponse<RefreshResponse>>()
		tokens.setAccess(data.access_token)
		tokens.setRefresh(data.refresh_token)
		const user = tokens.getUser()
		const profile = data.profile
		if (user && profile) {
			useAuth.getState()._setAuthenticated(user, profile)
		} else {
			useAuth.getState()._setUnauthenticated()
		}
	} catch {
		tokens.clear()
		useAuth.getState()._setUnauthenticated()
	}
}
