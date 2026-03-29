import type { AuthUser } from "@/types/api"

const TOKEN_KEY = "vstep_access_token"
const REFRESH_KEY = "vstep_refresh_token"
const USER_KEY = "vstep_user"
const ONBOARDING_PREFIX = "vstep_onboarding_done"

function save(accessToken: string, refreshToken: string, user: AuthUser) {
	localStorage.setItem(TOKEN_KEY, accessToken)
	localStorage.setItem(REFRESH_KEY, refreshToken)
	localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function clear() {
	// Clear onboarding key for current user before removing user data
	const currentUser = user()
	if (currentUser) {
		localStorage.removeItem(`${ONBOARDING_PREFIX}_${currentUser.id}`)
	}
	// Also clear legacy key (no userId suffix) from older sessions
	localStorage.removeItem(ONBOARDING_PREFIX)

	localStorage.removeItem(TOKEN_KEY)
	localStorage.removeItem(REFRESH_KEY)
	localStorage.removeItem(USER_KEY)
}

/** Per-user onboarding key — avoids leak across user sessions on same browser. */
function onboardingKey(): string {
	const u = user()
	return u ? `${ONBOARDING_PREFIX}_${u.id}` : ONBOARDING_PREFIX
}

function isOnboardingDone(): boolean {
	return localStorage.getItem(onboardingKey()) === "1"
}

function markOnboardingDone() {
	localStorage.setItem(onboardingKey(), "1")
}

function token() {
	return localStorage.getItem(TOKEN_KEY)
}

function refreshToken() {
	return localStorage.getItem(REFRESH_KEY)
}

function user(): AuthUser | null {
	const raw = localStorage.getItem(USER_KEY)
	if (!raw) return null
	try {
		return JSON.parse(raw) as AuthUser
	} catch {
		return null
	}
}

function isAuthenticated() {
	return !!token()
}

let redirecting = false
function handleAuthError() {
	if (redirecting) return
	redirecting = true
	clear()
	window.location.href = "/login"
}

export {
	clear,
	handleAuthError,
	isAuthenticated,
	isOnboardingDone,
	markOnboardingDone,
	refreshToken,
	save,
	token,
	user,
}
