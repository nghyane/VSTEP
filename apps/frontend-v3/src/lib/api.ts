import ky from "ky"
import { getApiError } from "#/lib/api-error"
import { useToast } from "#/lib/toast-store"
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
		beforeError: [
			(error) => {
				useToast.getState().add(getApiError(error))
				return error as unknown as Error
			},
		],
	},
})

export interface ApiResponse<T> {
	data: T
}
