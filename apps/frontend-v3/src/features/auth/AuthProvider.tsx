import { type ReactNode, useCallback, useMemo, useState } from "react"
import { type ApiResponse, api } from "#/lib/api"
import { createStrictContext } from "#/lib/create-strict-context"
import { tokenStorage } from "#/lib/token-storage"
import type { Profile, User } from "#/types/auth"

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
	register: (data: {
		email: string
		password: string
		nickname: string
		target_level: string
		target_deadline: string
	}) => Promise<void>
	logout: () => void
}

const [Provider, useAuth] = createStrictContext<AuthValue>("Auth")

export { useAuth }

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(() => tokenStorage.getUser())
	const [profile, setProfile] = useState<Profile | null>(() => tokenStorage.getProfile())

	const storeAuth = useCallback((data: LoginResponse) => {
		tokenStorage.setAccess(data.access_token)
		tokenStorage.setRefresh(data.refresh_token)
		tokenStorage.setUser(data.account)
		tokenStorage.setProfile(data.active_profile)
		setUser(data.account)
		setProfile(data.active_profile)
	}, [])

	const login = useCallback(
		async (email: string, password: string) => {
			const { data } = await api
				.post("auth/login", { json: { email, password } })
				.json<ApiResponse<LoginResponse>>()
			storeAuth(data)
		},
		[storeAuth],
	)

	const register = useCallback(
		async (input: {
			email: string
			password: string
			nickname: string
			target_level: string
			target_deadline: string
		}) => {
			const { data } = await api.post("auth/register", { json: input }).json<ApiResponse<LoginResponse>>()
			storeAuth(data)
		},
		[storeAuth],
	)

	const logout = useCallback(() => {
		tokenStorage.clear()
		setUser(null)
		setProfile(null)
	}, [])

	const value = useMemo<AuthValue>(
		() => ({ user, profile, isAuthenticated: user !== null, login, register, logout }),
		[user, profile, login, register, logout],
	)

	return <Provider value={value}>{children}</Provider>
}
