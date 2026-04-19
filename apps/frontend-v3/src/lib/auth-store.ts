import { create } from "zustand"
import { type ApiResponse, api } from "#/lib/api"
import { tokenStorage } from "#/lib/token-storage"
import type { Profile, User } from "#/types/auth"

interface AuthResponse {
	access_token: string
	refresh_token: string
	account: User
	active_profile: Profile | null
}

interface AuthState {
	user: User | null
	profile: Profile | null
}

interface AuthActions {
	login: (email: string, password: string) => Promise<void>
	register: (data: {
		email: string
		password: string
		nickname: string
		target_level: string
		target_deadline: string
	}) => Promise<void>
	logout: () => void
}

export type AuthStore = AuthState & AuthActions & { isAuthenticated: boolean }

const initialState: AuthState = {
	user: tokenStorage.getUser(),
	profile: tokenStorage.getProfile(),
}

export const useAuth = create<AuthStore>()((set) => {
	function authenticate(res: AuthResponse) {
		tokenStorage.setAccess(res.access_token)
		tokenStorage.setRefresh(res.refresh_token)
		tokenStorage.setUser(res.account)
		tokenStorage.setProfile(res.active_profile)
		set({ user: res.account, profile: res.active_profile, isAuthenticated: true })
	}

	return {
		...initialState,
		isAuthenticated: initialState.user !== null,

		async login(email, password) {
			const { data } = await api
				.post("auth/login", { json: { email, password } })
				.json<ApiResponse<AuthResponse>>()
			authenticate(data)
		},

		async register(input) {
			const { data } = await api.post("auth/register", { json: input }).json<ApiResponse<AuthResponse>>()
			authenticate(data)
		},

		logout() {
			tokenStorage.clear()
			set({ user: null, profile: null, isAuthenticated: false })
		},
	}
})
