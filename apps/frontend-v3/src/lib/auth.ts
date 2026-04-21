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

type AuthState =
	| { isAuthenticated: false; user: null; profile: null }
	| { isAuthenticated: true; user: User; profile: Profile }

type AuthActions = {
	login: (email: string, password: string) => Promise<void>
	register: (data: { email: string; password: string; nickname: string; target_level: string; target_deadline: string }) => Promise<void>
	logout: () => void
}

type AuthStore = AuthState & AuthActions

function getInitialState(): AuthState {
	const user = tokens.getUser()
	const profile = tokens.getProfile()
	if (user && profile) return { isAuthenticated: true, user, profile }
	return { isAuthenticated: false, user: null, profile: null }
}

function authenticate(res: AuthResponse, set: (s: AuthState) => void) {
	tokens.setAccess(res.access_token)
	tokens.setRefresh(res.refresh_token)
	tokens.setUser(res.user)
	tokens.setProfile(res.profile)
	set({ isAuthenticated: true, user: res.user, profile: res.profile })
}

const LOGGED_OUT: AuthState = { isAuthenticated: false, user: null, profile: null }

export const useAuth = create<AuthStore>()((set) => ({
	...getInitialState(),

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
		set(LOGGED_OUT)
	},
}))

/** Use inside _app routes — TypeScript narrows after isAuthenticated check */
export function useSession() {
	const state = useAuth()
	if (!state.isAuthenticated) throw new Error("useSession used outside authenticated context")
	return { user: state.user, profile: state.profile }
}
