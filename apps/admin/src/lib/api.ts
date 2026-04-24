import ky, { isHTTPError } from "ky"
import { getToken } from "#/lib/auth"

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
	},
})

export interface ApiResponse<T> {
	data: T
}

export interface ApiError {
	message: string
	errors?: Record<string, string[]>
}

export function extractError(err: unknown): ApiError {
	if (isHTTPError(err)) {
		const data = err.data as ApiError | undefined
		if (data?.message) return data
		return { message: err.message }
	}
	if (err instanceof Error) return { message: err.message }
	return { message: "Unknown error" }
}
