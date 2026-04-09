import type { AuthUser } from "@/types/api"

const TOKEN_KEY = "vstep_access_token"
const REFRESH_KEY = "vstep_refresh_token"
const USER_KEY = "vstep_user"

function save(accessToken: string, refreshToken: string, user: AuthUser) {
	localStorage.setItem(TOKEN_KEY, accessToken)
	localStorage.setItem(REFRESH_KEY, refreshToken)
	localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function clear() {
	localStorage.removeItem(TOKEN_KEY)
	localStorage.removeItem(REFRESH_KEY)
	localStorage.removeItem(USER_KEY)
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

export { clear, handleAuthError, isAuthenticated, refreshToken, save, token, user }
