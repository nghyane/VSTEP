import type { AuthUser, LoginResponse, RegisterResponse } from "@/types/api"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

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

// Internal: raw fetch with JSON headers
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const res = await fetch(`${API_URL}${path}`, {
		...options,
		headers: { "Content-Type": "application/json", ...options.headers },
	})
	if (!res.ok) {
		const body = await res.json().catch(() => ({}))
		const fallback = STATUS_MESSAGES[res.status] ?? "Đã có lỗi xảy ra"
		const serverMessage: string | undefined = body?.error?.message ?? body?.message
		const translated = serverMessage ? (ERROR_TRANSLATIONS[serverMessage] ?? fallback) : fallback
		throw new ApiError(res.status, translated)
	}
	return res.json()
}

class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message)
	}
}

// Authenticated request — injects Bearer token, handles 401 refresh
let refreshPromise: Promise<void> | null = null

async function authRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
	const { token, refreshToken: storedRefresh, save, clear } = await import("@/lib/auth")

	const accessToken = token()
	if (!accessToken) throw new ApiError(401, "Not authenticated")

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
			clear()
			throw err
		}

		if (!refreshPromise) {
			refreshPromise = request<LoginResponse>("/api/auth/refresh", {
				method: "POST",
				body: JSON.stringify({ refreshToken: refresh }),
			})
				.then((res) => {
					save(res.accessToken, res.refreshToken, res.user)
				})
				.catch(() => {
					clear()
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

// Public API
const api = {
	get: <T>(path: string) => authRequest<T>(path),
	post: <T>(path: string, body?: unknown) =>
		authRequest<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
	put: <T>(path: string, body?: unknown) =>
		authRequest<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
	patch: <T>(path: string, body?: unknown) =>
		authRequest<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
	delete: <T>(path: string) => authRequest<T>(path, { method: "DELETE" }),
}

// Auth endpoints (no auth header needed)
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
	return request<{ message: string }>("/api/auth/logout", {
		method: "POST",
		body: JSON.stringify({ refreshToken }),
		headers: { Authorization: `Bearer ${accessToken}` },
	})
}

function getMe(accessToken: string) {
	return request<{ user: AuthUser }>("/api/auth/me", {
		headers: { Authorization: `Bearer ${accessToken}` },
	})
}

export { api, ApiError, getMe, login, logout, register }
