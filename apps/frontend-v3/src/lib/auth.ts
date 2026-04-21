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

interface SwitchResponse {
	access_token: string
	refresh_token: string
	profile: Profile
}

type AuthState =
	| { isAuthenticated: false; user: null; profile: null }
	| { isAuthenticated: true; user: User; profile: Profile }

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
}

type AuthStore = AuthState & AuthActions

function getInitialState(): AuthState {
	const user = tokens.getUser()
	const profile = tokens.getProfile()
	if (user && profile) return { isAuthenticated: true, user, profile }
	return { isAuthenticated: false, user: null, profile: null }
}

export const useAuth = create<AuthStore>()((set, get) => ({
	...getInitialState(),

	async login(email, password) {
		const { data } = await api
			.post("auth/login", { json: { email, password } })
			.json<ApiResponse<AuthResponse>>()
		tokens.setAccess(data.access_token)
		tokens.setRefresh(data.refresh_token)
		tokens.setUser(data.user)
		tokens.setProfile(data.profile)
		set({ isAuthenticated: true, user: data.user, profile: data.profile })
	},

	async register(input) {
		const { data } = await api.post("auth/register", { json: input }).json<ApiResponse<AuthResponse>>()
		tokens.setAccess(data.access_token)
		tokens.setRefresh(data.refresh_token)
		tokens.setUser(data.user)
		tokens.setProfile(data.profile)
		set({ isAuthenticated: true, user: data.user, profile: data.profile })
	},

	async switchProfile(profileId) {
		const refreshToken = tokens.getRefresh() ?? ""
		const { data } = await api
			.post("auth/switch-profile", { json: { profile_id: profileId, refresh_token: refreshToken } })
			.json<ApiResponse<SwitchResponse>>()
		tokens.setAccess(data.access_token)
		tokens.setRefresh(data.refresh_token)
		tokens.setProfile(data.profile)
		const state = get()
		if (state.isAuthenticated) {
			set({ isAuthenticated: true, user: state.user, profile: data.profile })
		}
	},

	logout() {
		tokens.clear()
		set({ isAuthenticated: false, user: null, profile: null })
	},
}))

export function useSession() {
	const state = useAuth()
	if (!state.isAuthenticated) throw new Error("useSession used outside authenticated context")
	return { user: state.user, profile: state.profile }
}
