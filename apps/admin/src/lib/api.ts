import ky from "ky"
import { clearAuth, getToken } from "#/lib/auth"

export const api = ky.create({
	prefix: import.meta.env.VITE_API_URL,
	timeout: 30_000,
	retry: 0,
	hooks: {
		beforeRequest: [
			({ request }) => {
				const token = getToken()
				if (token) request.headers.set("Authorization", `Bearer ${token}`)
			},
		],
		afterResponse: [
			({ response }) => {
				if (response.status === 401 && getToken()) {
					clearAuth()
					if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
						window.location.href = "/login"
					}
				}
			},
		],
	},
})

export interface ApiResponse<T> {
	data: T
}

export interface PaginatedMeta {
	current_page: number
	per_page: number
	total: number
	last_page: number
}

export interface PaginatedResponse<T> {
	data: T[]
	meta: PaginatedMeta
}

export interface ApiError {
	message: string
	errors?: Record<string, string[]>
}

/**
 * Đọc body lỗi từ ky error (cần await — ky không pre-parse body).
 * Dùng duck-typing thay vì instanceof để tránh mismatch khi ky bundle multiple copies.
 */
export async function extractError(err: unknown): Promise<ApiError> {
	const response = (err as { response?: Response })?.response
	if (response && typeof response.clone === "function") {
		try {
			const data = (await response.clone().json()) as ApiError
			if (data?.message) return data
		} catch {
			// non-JSON body
		}
	}
	if (err instanceof Error) return { message: err.message }
	return { message: "Unknown error" }
}
