import ky from "ky"
import { tokenStorage } from "#/lib/token-storage"

export const api = ky.create({
	prefix: import.meta.env.VITE_API_URL || "http://localhost:8010/api/v1",
	hooks: {
		beforeRequest: [
			(req) => {
				const token = tokenStorage.getAccess()
				if (token) req.headers.set("Authorization", `Bearer ${token}`)
			},
		],
		afterResponse: [
			(_req, _opts, res) => {
				if (res.status === 401) {
					tokenStorage.clear()
					window.location.replace("/")
				}
			},
		],
	},
})

export interface ApiResponse<T> {
	data: T
}
