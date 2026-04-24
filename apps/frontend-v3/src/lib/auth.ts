import { HTTPError } from "ky"
import { create } from "zustand"
import { useWelcomeGift } from "#/features/onboarding/use-welcome-gift"
import { type ApiResponse, api } from "#/lib/api"
import { queryClient } from "#/lib/query-client"
import { useToast } from "#/lib/toast"
import { tokens } from "#/lib/tokens"
import type { Profile, User } from "#/types/auth"

function showError(error: unknown) {
	if (error instanceof HTTPError) {
		const body = error.data as { message?: string } | undefined
		useToast.getState().add(body?.message ?? "Đã có lỗi xảy ra.")
	} else {
		useToast.getState().add("Đã có lỗi xảy ra.")
	}
}

interface OnboardingBonus {
	amount: number
	granted: boolean
}

interface AuthResponse {
	access_token: string
	refresh_token: string
	user: User
	profile: Profile
	onboarding_bonus?: OnboardingBonus
}

interface GoogleLoginResponse {
	access_token: string
	refresh_token: string
	user: User
	profile: Profile | null
	needs_onboarding: boolean
	suggested_nickname: string | null
}

interface CompleteOnboardingResponse {
	access_token: string
	expires_in: number
	profile: Profile
	onboarding_bonus?: OnboardingBonus
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

export interface GoogleLoginResult {
	needsOnboarding: boolean
	suggestedNickname: string | null
}

type AuthActions = {
	login: (email: string, password: string) => Promise<void>
	register: (data: {
		email: string
		password: string
		nickname: string
		target_level: string
		target_deadline: string
	}) => Promise<void>
	loginWithGoogle: (idToken: string) => Promise<GoogleLoginResult | null>
	completeOnboarding: (data: {
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
		try {
			const { data } = await api
				.post("auth/login", { json: { email, password } })
				.json<ApiResponse<AuthResponse>>()
			tokens.setAccess(data.access_token)
			tokens.setRefresh(data.refresh_token)
			tokens.setUser(data.user)
			queryClient.clear()
			set({ status: "authenticated", user: data.user, profile: data.profile })
			useToast.getState().add("Đăng nhập thành công", "success")
		} catch (e) {
			showError(e)
		}
	},

	async register(input) {
		try {
			const { data } = await api.post("auth/register", { json: input }).json<ApiResponse<AuthResponse>>()
			tokens.setAccess(data.access_token)
			tokens.setRefresh(data.refresh_token)
			tokens.setUser(data.user)
			queryClient.clear()
			set({ status: "authenticated", user: data.user, profile: data.profile })
			if (data.onboarding_bonus?.granted) {
				useWelcomeGift.getState().show(data.onboarding_bonus.amount)
			} else {
				useToast.getState().add("Tạo tài khoản thành công", "success")
			}
		} catch (e) {
			showError(e)
		}
	},

	async loginWithGoogle(idToken) {
		try {
			const { data } = await api
				.post("auth/google", { json: { id_token: idToken } })
				.json<ApiResponse<GoogleLoginResponse>>()
			tokens.setAccess(data.access_token)
			tokens.setRefresh(data.refresh_token)
			tokens.setUser(data.user)
			queryClient.clear()

			if (data.needs_onboarding || data.profile === null) {
				return {
					needsOnboarding: true,
					suggestedNickname: data.suggested_nickname,
				}
			}

			set({ status: "authenticated", user: data.user, profile: data.profile })
			useToast.getState().add("Đăng nhập thành công", "success")
			return { needsOnboarding: false, suggestedNickname: null }
		} catch (e) {
			showError(e)
			return null
		}
	},

	async completeOnboarding(input) {
		try {
			const { data } = await api
				.post("auth/complete-onboarding", { json: input })
				.json<ApiResponse<CompleteOnboardingResponse>>()
			tokens.setAccess(data.access_token)
			const user = tokens.getUser()
			if (user) {
				set({ status: "authenticated", user, profile: data.profile })
				if (data.onboarding_bonus?.granted) {
					useWelcomeGift.getState().show(data.onboarding_bonus.amount)
				} else {
					useToast.getState().add("Hoàn tất thiết lập", "success")
				}
			}
		} catch (e) {
			showError(e)
		}
	},

	async switchProfile(profileId) {
		try {
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
			useToast.getState().add("Đã chuyển hồ sơ", "success")
		} catch (e) {
			showError(e)
		}
	},

	logout() {
		tokens.clear()
		queryClient.clear()
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
