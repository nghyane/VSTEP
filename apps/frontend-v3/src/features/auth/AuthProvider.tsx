import { type ReactNode, useCallback, useMemo, useState } from "react"
import { type ApiResponse, api } from "#/lib/api"
import { createStrictContext } from "#/lib/create-strict-context"

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

interface LoginResponse {
	access_token: string
	refresh_token: string
	account: User
	active_profile: Profile | null
}

interface AuthValue {
	user: User | null
	profile: Profile | null
	isAuthenticated: boolean
	login: (email: string, password: string) => Promise<void>
	logout: () => void
}

const STORAGE_KEYS = ["access_token", "refresh_token", "user", "profile"] as const

const [Provider, useAuth] = createStrictContext<AuthValue>("Auth")

export { useAuth }

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(() => {
		const s = localStorage.getItem("user")
		return s ? JSON.parse(s) : null
	})
	const [profile, setProfile] = useState<Profile | null>(() => {
		const s = localStorage.getItem("profile")
		return s ? JSON.parse(s) : null
	})

	const login = useCallback(async (email: string, password: string) => {
		const { data } = await api
			.post("auth/login", { json: { email, password } })
			.json<ApiResponse<LoginResponse>>()
		localStorage.setItem("access_token", data.access_token)
		localStorage.setItem("refresh_token", data.refresh_token)
		localStorage.setItem("user", JSON.stringify(data.account))
		localStorage.setItem("profile", JSON.stringify(data.active_profile))
		setUser(data.account)
		setProfile(data.active_profile)
	}, [])

	const logout = useCallback(() => {
		for (const key of STORAGE_KEYS) localStorage.removeItem(key)
		setUser(null)
		setProfile(null)
	}, [])

	const value = useMemo<AuthValue>(
		() => ({ user, profile, isAuthenticated: user !== null, login, logout }),
		[user, profile, login, logout],
	)

	return <Provider value={value}>{children}</Provider>
}
