import ky from "ky"
import { tokens } from "#/lib/tokens"

export const api = ky.create({
	prefix: import.meta.env.VITE_API_URL || "http://localhost:8010/api/v1",
	hooks: {
		beforeRequest: [
			({ request }) => {
				const token = tokens.getAccess()
				if (token) request.headers.set("Authorization", `Bearer ${token}`)
			},
		],
	},
})

export interface ApiResponse<T> {
	data: T
}
