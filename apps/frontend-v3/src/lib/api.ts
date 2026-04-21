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
