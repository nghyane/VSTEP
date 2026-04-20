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

interface AuthStore {
	user: User | null
	profile: Profile | null
	isAuthenticated: boolean
	login: (email: string, password: string) => Promise<void>
	register: (data: { email: string; password: string; nickname: string; target_level: string; target_deadline: string }) => Promise<void>
	logout: () => void
}

function authenticate(res: AuthResponse, set: (s: Partial<AuthStore>) => void) {
	tokens.setAccess(res.access_token)
	tokens.setRefresh(res.refresh_token)
	tokens.setUser(res.user)
	tokens.setProfile(res.profile)
	set({ user: res.user, profile: res.profile, isAuthenticated: true })
}

export const useAuth = create<AuthStore>()((set) => ({
	user: tokens.getUser(),
	profile: tokens.getProfile(),
	isAuthenticated: tokens.getAccess() !== null,

	async login(email, password) {
		const { data } = await api.post("auth/login", { json: { email, password } }).json<ApiResponse<AuthResponse>>()
		authenticate(data, set)
	},

	async register(input) {
		const { data } = await api.post("auth/register", { json: input }).json<ApiResponse<AuthResponse>>()
		authenticate(data, set)
	},

	logout() {
		tokens.clear()
		set({ user: null, profile: null, isAuthenticated: false })
	},
}))

/** Use inside _app routes only — guaranteed non-null after auth guard */
export function useProfile(): Profile {
	return useAuth((s) => s.profile) as Profile
}

export function useUser(): User {
	return useAuth((s) => s.user) as User
}