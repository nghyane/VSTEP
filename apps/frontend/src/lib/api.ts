import type { AuthUser, LoginResponse, RegisterResponse } from "@/types/api"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

// ---------------------------------------------------------------------------
// snake_case ↔ camelCase transforms (for Laravel ↔ React convention bridge)
// ---------------------------------------------------------------------------

function snakeToCamel(str: string): string {
	return str.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

function camelToSnake(str: string): string {
	return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
}

function transformKeys(obj: unknown, fn: (key: string) => string): unknown {
	if (Array.isArray(obj)) return obj.map((item) => transformKeys(item, fn))
	if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
		return Object.fromEntries(
			Object.entries(obj as Record<string, unknown>).map(([k, v]) => [fn(k), transformKeys(v, fn)]),
		)
	}
	return obj
}

function toCamelCase<T>(obj: unknown): T {
	return transformKeys(obj, snakeToCamel) as T
}

function toSnakeCase(obj: unknown): unknown {
	return transformKeys(obj, camelToSnake)
}

// Unwrap Laravel's { data: ... } wrapper for single-resource responses.
// Paginated responses ({ data: [...], meta, links }) are kept as-is but meta is normalized.
function unwrapData(obj: unknown): unknown {
	if (obj && typeof obj === "object" && !Array.isArray(obj)) {
		const rec = obj as Record<string, unknown>
		const keys = Object.keys(rec)

		// Single-resource: { data: ... } → unwrap
		if (keys.length === 1 && keys[0] === "data") {
			return rec.data
		}

		// Paginated: { data: [...], meta: { current_page, per_page, ... }, links }
		// Normalize Laravel meta → FE PaginationMeta { page, limit, total, totalPages }
		if (Array.isArray(rec.data) && rec.meta && typeof rec.meta === "object") {
			const m = rec.meta as Record<string, unknown>
			rec.meta = {
				page: m.current_page ?? m.page,
				limit: m.per_page ?? m.limit,
				total: m.total,
				totalPages: m.last_page ?? m.totalPages,
			}
			delete rec.links
		}
	}
	return obj
}

// Auto-prefix /api/ → /api/v1/ for Laravel backend-v2
function buildUrl(path: string): string {
	return `${API_URL}${path.replace(/^\/api\//, "/api/v1/")}`
}

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

const STATUS_MESSAGES: Record<number, string> = {
	400: "Dữ liệu không hợp lệ",
	401: "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại",
	403: "Bạn không có quyền thực hiện thao tác này",
	404: "Không tìm thấy dữ liệu yêu cầu",
	409: "Dữ liệu bị trùng lặp",
	422: "Không thể xử lý yêu cầu",
	500: "Lỗi hệ thống, vui lòng thử lại sau",
}

const ERROR_TRANSLATIONS: Record<string, string> = {
	// Auth
	"Invalid credentials": "Email hoặc mật khẩu không đúng",
	"Invalid credentials.": "Email hoặc mật khẩu không đúng",
	"Invalid refresh token": "Phiên đăng nhập không hợp lệ",
	// Users
	"Current password is incorrect": "Mật khẩu hiện tại không đúng",
	"Email already registered": "Email này đã được đăng ký",
	"Email already in use": "Email này đã được sử dụng",
	"You can only view your own profile": "Bạn chỉ có thể xem hồ sơ của mình",
	"You can only update your own profile": "Bạn chỉ có thể cập nhật hồ sơ của mình",
	"You can only change your own password": "Bạn chỉ có thể đổi mật khẩu của mình",
	"Only admins can change user roles": "Chỉ quản trị viên mới có thể thay đổi vai trò",
	"Cannot delete your own account": "Không thể xóa tài khoản của chính mình",
	// Generic
	"Not found": "Không tìm thấy",
	Unauthorized: "Chưa xác thực",
	Conflict: "Dữ liệu bị trùng lặp",
}

// Parse Laravel validation errors: { message, errors: { field: ["msg", ...] } }
function parseLaravelErrors(body: Record<string, unknown>): string | null {
	if (body?.errors && typeof body.errors === "object" && !Array.isArray(body.errors)) {
		const errors = body.errors as Record<string, string[]>
		const firstField = Object.keys(errors)[0]
		if (firstField && errors[firstField]?.[0]) {
			return errors[firstField][0]
		}
	}
	return null
}

class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message)
	}
}

// ---------------------------------------------------------------------------
// Core request function
// ---------------------------------------------------------------------------

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	// Transform JSON request body: camelCase → snake_case
	let body = options.body
	if (body && typeof body === "string") {
		try {
			body = JSON.stringify(toSnakeCase(JSON.parse(body)))
		} catch {
			// not JSON, keep as-is
		}
	}

	const res = await fetch(buildUrl(path), {
		...options,
		body,
		headers: { "Content-Type": "application/json", ...options.headers },
	})

	if (!res.ok) {
		const errorBody = await res.json().catch(() => ({}))
		const serverMessage: string | undefined = errorBody?.error?.message ?? errorBody?.message

		// Backend returns 500 "Route [login] not defined" when unauthenticated (missing 401 handler)
		// Treat as 401 so the refresh/redirect logic kicks in
		if (res.status === 500 && serverMessage && /route \[login\] not defined/i.test(serverMessage)) {
			throw new ApiError(401, STATUS_MESSAGES[401])
		}

		const validation = parseLaravelErrors(errorBody)
		if (validation) throw new ApiError(res.status, validation)
		const fallback = STATUS_MESSAGES[res.status] ?? "Đã có lỗi xảy ra"
		const translated = serverMessage ? (ERROR_TRANSLATIONS[serverMessage] ?? fallback) : fallback
		throw new ApiError(res.status, translated)
	}

	// Transform response: unwrap { data } wrapper + snake_case → camelCase
	const json = await res.json()
	return toCamelCase<T>(unwrapData(json))
}

// ---------------------------------------------------------------------------
// Authenticated request — injects Bearer token, handles 401 refresh
// ---------------------------------------------------------------------------

let refreshPromise: Promise<void> | null = null

async function authRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
	const {
		token,
		refreshToken: storedRefresh,
		save,
		user: getUser,
		handleAuthError,
	} = await import("@/lib/auth")

	const accessToken = token()
	if (!accessToken) {
		handleAuthError()
		throw new ApiError(401, "Not authenticated")
	}

	const authedOptions = {
		...options,
		headers: { ...options.headers, Authorization: `Bearer ${accessToken}` },
	}

	try {
		return await request<T>(path, authedOptions)
	} catch (err) {
		if (!(err instanceof ApiError) || err.status !== 401) throw err

		// Try refresh
		const refresh = storedRefresh()
		if (!refresh) {
			handleAuthError()
			throw err
		}

		if (!refreshPromise) {
			refreshPromise = request<{ accessToken: string; refreshToken: string }>("/api/auth/refresh", {
				method: "POST",
				body: JSON.stringify({ refreshToken: refresh }),
			})
				.then((res) => {
					// Refresh response doesn't include user — keep existing user data
					const currentUser = getUser()
					if (currentUser) save(res.accessToken, res.refreshToken, currentUser)
				})
				.catch(() => {
					handleAuthError()
					throw new ApiError(401, "Session expired")
				})
				.finally(() => {
					refreshPromise = null
				})
		}

		await refreshPromise

		// Retry with new token
		const newToken = token()
		return request<T>(path, {
			...options,
			headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
		})
	}
}

// ---------------------------------------------------------------------------
// File upload (multipart — no JSON transform)
// ---------------------------------------------------------------------------

async function uploadFile<T>(path: string, formData: FormData): Promise<T> {
	const { token: getToken, handleAuthError } = await import("@/lib/auth")

	const accessToken = getToken()
	if (!accessToken) {
		handleAuthError()
		throw new ApiError(401, "Not authenticated")
	}

	const res = await fetch(buildUrl(path), {
		method: "POST",
		headers: { Authorization: `Bearer ${accessToken}` },
		body: formData,
	})

	if (!res.ok) {
		const errorBody = await res.json().catch(() => ({}))
		if (res.status === 401) {
			handleAuthError()
			throw new ApiError(401, "Session expired")
		}
		const validation = parseLaravelErrors(errorBody)
		if (validation) throw new ApiError(res.status, validation)
		const fallback = STATUS_MESSAGES[res.status] ?? "Đã có lỗi xảy ra"
		const serverMessage: string | undefined = errorBody?.error?.message ?? errorBody?.message
		const translated = serverMessage ? (ERROR_TRANSLATIONS[serverMessage] ?? fallback) : fallback
		throw new ApiError(res.status, translated)
	}

	const json = await res.json()
	return toCamelCase<T>(unwrapData(json))
}

// ---------------------------------------------------------------------------
// Public API object (used by hooks)
// ---------------------------------------------------------------------------

const api = {
	get: <T>(path: string) => authRequest<T>(path),
	post: <T>(path: string, body?: unknown) =>
		authRequest<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
	put: <T>(path: string, body?: unknown) =>
		authRequest<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
	patch: <T>(path: string, body?: unknown) =>
		authRequest<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
	delete: <T>(path: string) => authRequest<T>(path, { method: "DELETE" }),
	upload: <T>(path: string, formData: FormData) => uploadFile<T>(path, formData),
}

// ---------------------------------------------------------------------------
// Auth endpoints (public — no Bearer token needed)
// ---------------------------------------------------------------------------

function login(email: string, password: string) {
	return request<LoginResponse>("/api/auth/login", {
		method: "POST",
		body: JSON.stringify({ email, password }),
	})
}

function register(email: string, password: string, fullName?: string) {
	return request<RegisterResponse>("/api/auth/register", {
		method: "POST",
		body: JSON.stringify({ email, password, fullName }),
	})
}

function logout(refreshToken: string, accessToken: string) {
	return request<{ success: boolean }>("/api/auth/logout", {
		method: "POST",
		body: JSON.stringify({ refreshToken }),
		headers: { Authorization: `Bearer ${accessToken}` },
	})
}

function getMe(accessToken: string) {
	return request<AuthUser>("/api/auth/me", {
		headers: { Authorization: `Bearer ${accessToken}` },
	})
}

export { api, ApiError, getMe, login, logout, register }
