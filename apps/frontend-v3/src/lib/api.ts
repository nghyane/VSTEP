import ky from "ky"

export function getAccessToken(): string | null {
	return localStorage.getItem("access_token")
}

export const api = ky.create({
	prefix: import.meta.env.VITE_API_URL || "http://localhost:8010/api/v1",
	hooks: {
		beforeRequest: [
			(req) => {
				const token = getAccessToken()
				if (token) req.headers.set("Authorization", `Bearer ${token}`)
			},
		],
	},
})

export interface ApiResponse<T> {
	data: T
}
