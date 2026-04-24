import { create } from "zustand"

const TOKEN_KEY = "vstep_admin_token"
const USER_KEY = "vstep_admin_user"

export type AdminRole = "admin" | "staff" | "teacher"

export interface AdminUser {
	id: string
	email: string
	name: string
	role: AdminRole
}

interface AuthState {
	token: string | null
	user: AdminUser | null
	setSession: (token: string, user: AdminUser) => void
	clear: () => void
}

export const useAuth = create<AuthState>((set) => ({
	token: typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY),
	user: readStoredUser(),
	setSession: (token, user) => {
		localStorage.setItem(TOKEN_KEY, token)
		localStorage.setItem(USER_KEY, JSON.stringify(user))
		set({ token, user })
	},
	clear: () => {
		localStorage.removeItem(TOKEN_KEY)
		localStorage.removeItem(USER_KEY)
		set({ token: null, user: null })
	},
}))

export function getToken(): string | null {
	return useAuth.getState().token
}

export function clearAuth() {
	useAuth.getState().clear()
}

function readStoredUser(): AdminUser | null {
	if (typeof window === "undefined") return null
	const raw = localStorage.getItem(USER_KEY)
	if (!raw) return null
	try {
		return JSON.parse(raw) as AdminUser
	} catch {
		return null
	}
}
