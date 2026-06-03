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

interface LoginResponse {
	access_token: string
	refresh_token: string
	user: User
	// Tài khoản admin tạo có thể chưa có profile → cần onboarding ở lần login đầu.
	profile: Profile | null
	onboarding_bonus?: OnboardingBonus
}

interface RegisterResponse {
	user: User
	profile: Profile
	email_verification_sent: boolean
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
	user: User
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

/**
 * Trang user FE chỉ phục vụ vai trò "learner". Admin/teacher/staff đăng nhập
 * bằng tài khoản của họ ở trang admin riêng — vào đây sẽ vỡ vì không có
 * profile/onboarding. Reject ngay sau login + show mascot lạc buồn (xem
 * RoleRejectedDialog mount ở __root.tsx).
 */
const LEARNER_ROLE = "learner"

const PROFILE_SCOPED_QUERY_PREFIXES = new Set([
	"activity-heatmap",
	"assessment-attempts",
	"booking",
	"conversation-review",
	"courses",
	"exam-sessions",
	"grammar",
	"learning-path",
	"notifications",
	"overview",
	"practice",
	"shadowing-pronunciation-review",
	"streak",
	"vocab",
	"wallet",
])

function isProfileScopedQuery(queryKey: readonly unknown[]): boolean {
	const prefix = queryKey[0]
	return typeof prefix === "string" && PROFILE_SCOPED_QUERY_PREFIXES.has(prefix)
}

export interface LoginResult {
	needsOnboarding: boolean
	suggestedNickname: string | null
}

type AuthActions = {
	roleRejected: { role: string; email: string } | null
	dismissRoleRejected: () => void
	login: (email: string, password: string) => Promise<LoginResult | null>
	checkEmail: (email: string) => Promise<{ ok: true } | { ok: false; message: string }>
	register: (data: {
		email: string
		password: string
		nickname: string
		entry_level: string
		target_level: string
		target_deadline: string
	}) => Promise<{ email: string } | null>
	loginWithGoogle: (idToken: string) => Promise<LoginResult | null>
	completeOnboarding: (data: {
		nickname: string
		entry_level: string
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
	roleRejected: null,

	_setAuthenticated: (user, profile) => set({ status: "authenticated", user, profile }),
	_setUnauthenticated: () => set({ status: "unauthenticated" }),

	dismissRoleRejected: () => set({ roleRejected: null }),

	async login(email, password) {
		try {
			const { data } = await api
				.post("auth/login", { json: { email, password } })
				.json<ApiResponse<LoginResponse>>()
			if (data.user.role !== LEARNER_ROLE) {
				// Clear hết token + cache để khỏi rò qua reload, KHÔNG set authenticated.
				tokens.clear()
				queryClient.clear()
				set({ status: "unauthenticated", roleRejected: { role: data.user.role, email: data.user.email } })
				return null
			}
			tokens.setAccess(data.access_token)
			tokens.setRefresh(data.refresh_token)
			tokens.setUser(data.user)
			queryClient.clear()
			// Tài khoản admin tạo chưa có profile → cần onboarding trước khi vào _app
			// (Sidebar đọc profile.nickname sẽ crash nếu profile null).
			if (data.profile === null) {
				return { needsOnboarding: true, suggestedNickname: null }
			}
			set({ status: "authenticated", user: data.user, profile: data.profile, roleRejected: null })
			useToast.getState().add("Đăng nhập thành công", "success")
			return { needsOnboarding: false, suggestedNickname: null }
		} catch (e) {
			showError(e)
			return null
		}
	},

	async checkEmail(email) {
		try {
			await api.post("auth/email/check", { json: { email } }).json<ApiResponse<{ available: boolean }>>()
			return { ok: true }
		} catch (e) {
			if (e instanceof HTTPError) {
				const body = e.data as { errors?: { email?: string[] }; message?: string } | undefined
				const message = body?.errors?.email?.[0] ?? body?.message ?? "Email không hợp lệ."
				return { ok: false, message }
			}
			return { ok: false, message: "Không kiểm tra được email. Hãy thử lại." }
		}
	},

	async register(input) {
		try {
			const { data } = await api.post("auth/register", { json: input }).json<ApiResponse<RegisterResponse>>()
			useToast.getState().add("Đã gửi email xác thực", "success")
			return { email: data.user.email }
		} catch (e) {
			showError(e)
			return null
		}
	},

	async loginWithGoogle(idToken) {
		try {
			const { data } = await api
				.post("auth/google", { json: { id_token: idToken } })
				.json<ApiResponse<GoogleLoginResponse>>()
			if (data.user.role !== LEARNER_ROLE) {
				tokens.clear()
				queryClient.clear()
				set({ status: "unauthenticated", roleRejected: { role: data.user.role, email: data.user.email } })
				return null
			}
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
			// 409 Conflict — email đã đăng ký nhưng chưa verify → BE chống account takeover.
			// User cần đăng nhập bằng password trước để verify email ownership.
			if (e instanceof HTTPError && e.response.status === 409) {
				const body = e.data as { message?: string } | undefined
				useToast
					.getState()
					.add(body?.message ?? "Email này đã được đăng ký. Vui lòng đăng nhập bằng mật khẩu.")
				return null
			}
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
			await queryClient.cancelQueries({ predicate: (query) => isProfileScopedQuery(query.queryKey) })
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
			queryClient.removeQueries({ predicate: (query) => isProfileScopedQuery(query.queryKey) })
			queryClient.invalidateQueries({ predicate: (query) => isProfileScopedQuery(query.queryKey) })
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
		// Luôn ghi đè user từ BE — đảm bảo các field mới (vd has_password) cập nhật
		// cho session cũ thay vì để stale trong localStorage tới khi user logout.
		tokens.setUser(data.user)
		const user = data.user
		const profile = data.profile
		if (user.role !== LEARNER_ROLE) {
			// Guard: token cũ của admin/teacher → reset session.
			tokens.clear()
			useAuth.setState({
				status: "unauthenticated",
				roleRejected: { role: user.role, email: user.email },
			})
			return
		}
		if (profile) {
			useAuth.getState()._setAuthenticated(user, profile)
		} else {
			useAuth.getState()._setUnauthenticated()
		}
	} catch (e) {
		// Refresh token bị reject (TTL hết, BE rotate format, ...) → clear session.
		// Chỉ show toast khi user đã có session trước (refresh token tồn tại).
		tokens.clear()
		useAuth.getState()._setUnauthenticated()
		if (e instanceof HTTPError && e.response.status === 422) {
			useToast.getState().add("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
		}
	}
}
