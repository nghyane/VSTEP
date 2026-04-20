import ky from "ky"
import { tokenStorage } from "#/lib/token-storage"

export const api = ky.create({
	prefix: import.meta.env.VITE_API_URL || "http://localhost:8010/api/v1",
	hooks: {
		beforeRequest: [
			({ request }) => {
				const token = tokenStorage.getAccess()
				if (token) request.headers.set("Authorization", `Bearer ${token}`)
			},
		],
		afterResponse: [
			({ response }) => {
				if (response.status === 401) {
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
