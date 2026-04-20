import { create } from "zustand"
import { type ApiResponse, api } from "#/lib/api"
import { tokenStorage } from "#/lib/tokens"
import type { Profile, User } from "#/types/auth"

interface AuthResponse {
	access_token: string
	refresh_token: string
	user: User
	profile: Profile | null
}

interface AuthStore {
	user: User | null
	profile: Profile | null
	isAuthenticated: boolean
	login: (email: string, password: string) => Promise<void>
	register: (data: { email: string; password: string }) => Promise<void>
	logout: () => void
}

function authenticate(res: AuthResponse, set: (s: Partial<AuthStore>) => void) {
	tokenStorage.setAccess(res.access_token)
	tokenStorage.setRefresh(res.refresh_token)
	tokenStorage.setUser(res.user)
	tokenStorage.setProfile(res.profile)
	set({ user: res.user, profile: res.profile, isAuthenticated: true })
}

export const useAuth = create<AuthStore>()((set) => ({
	user: tokenStorage.getUser(),
	profile: tokenStorage.getProfile(),
	isAuthenticated: tokenStorage.getAccess() !== null,

	async login(email, password) {
		const { data } = await api.post("auth/login", { json: { email, password } }).json<ApiResponse<AuthResponse>>()
		authenticate(data, set)
	},

	async register(input) {
		const { data } = await api.post("auth/register", { json: input }).json<ApiResponse<AuthResponse>>()
		authenticate(data, set)
	},

	logout() {
		tokenStorage.clear()
		set({ user: null, profile: null, isAuthenticated: false })
	},
}))
