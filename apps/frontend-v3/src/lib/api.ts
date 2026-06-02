import ky from "ky"
import { useAuth } from "#/lib/auth"
import { tokens } from "#/lib/tokens"

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"

interface RefreshTokenResponse {
	access_token: string
	refresh_token: string
	user: unknown
}

let refreshPromise: Promise<RefreshTokenResponse> | null = null

function clearAuthAndRedirect() {
	tokens.clear()
	useAuth.getState()._setUnauthenticated()
	window.location.href = "/?auth=login"
}

async function refreshSession(refreshToken: string): Promise<RefreshTokenResponse> {
	if (!refreshPromise) {
		refreshPromise = fetch(`${API_URL}/auth/refresh`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ refresh_token: refreshToken }),
		})
			.then(async (response) => {
				if (!response.ok) throw new Error("refresh failed")
				const body = (await response.json()) as { data: RefreshTokenResponse }
				return body.data
			})
			.finally(() => {
				refreshPromise = null
			})
	}

	return refreshPromise
}

export const api = ky.create({
	prefix: API_URL,
	hooks: {
		beforeRequest: [
			({ request }) => {
				const token = tokens.getAccess()
				if (token) request.headers.set("Authorization", `Bearer ${token}`)
			},
		],
		afterResponse: [
			async ({ request, response }) => {
				if (response.status !== 401) return response
				if (new URL(request.url).pathname.endsWith("/auth/refresh")) return response

				const retryFlag = request.headers.get("X-Retry")
				if (retryFlag) {
					clearAuthAndRedirect()
					return response
				}

				const refreshToken = tokens.getRefresh()
				if (!refreshToken) {
					clearAuthAndRedirect()
					return response
				}

				try {
					const data = await refreshSession(refreshToken)
					tokens.setAccess(data.access_token)
					tokens.setRefresh(data.refresh_token)
					tokens.setUser(data.user)

					request.headers.set("Authorization", `Bearer ${data.access_token}`)
					request.headers.set("X-Retry", "1")
					return ky(request)
				} catch {
					clearAuthAndRedirect()
					return response
				}
			},
		],
	},
})

export interface ApiResponse<T> {
	data: T
}

export interface PaginationMeta {
	current_page: number
	last_page: number
	per_page: number
	total: number
}

export interface PaginationLinks {
	first: string
	last: string
	prev: string | null
	next: string | null
}

export interface PaginatedResponse<T> {
	data: T[]
	meta: PaginationMeta
	links: PaginationLinks
}
