import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react"
import { type ApiResponse, api } from "#/lib/api"

interface User {
	id: string
	email: string
	role: string
}

interface Profile {
	id: string
	nickname: string
	target_level: string | null
}

interface AuthState {
	user: User | null
	profile: Profile | null
	isAuthenticated: boolean
	login: (email: string, password: string) => Promise<void>
	logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
	const ctx = useContext(AuthContext)
	if (!ctx) throw new Error("useAuth must be inside AuthProvider")
	return ctx
}

interface LoginResponse {
	access_token: string
	refresh_token: string
	account: User
	active_profile: Profile | null
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(() => {
		const stored = localStorage.getItem("user")
		return stored ? JSON.parse(stored) : null
	})
	const [profile, setProfile] = useState<Profile | null>(() => {
		const stored = localStorage.getItem("profile")
		return stored ? JSON.parse(stored) : null
	})

	const login = useCallback(async (email: string, password: string) => {
		const res = await api.post("auth/login", { json: { email, password } }).json<ApiResponse<LoginResponse>>()
		const data = res.data
		localStorage.setItem("access_token", data.access_token)
		localStorage.setItem("refresh_token", data.refresh_token)
		localStorage.setItem("user", JSON.stringify(data.account))
		if (data.active_profile) {
			localStorage.setItem("profile", JSON.stringify(data.active_profile))
		}
		setUser(data.account)
		setProfile(data.active_profile)
	}, [])

	const logout = useCallback(() => {
		localStorage.removeItem("access_token")
		localStorage.removeItem("refresh_token")
		localStorage.removeItem("user")
		localStorage.removeItem("profile")
		setUser(null)
		setProfile(null)
	}, [])

	const value = useMemo(
		() => ({ user, profile, isAuthenticated: user !== null, login, logout }),
		[user, profile, login, logout],
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
