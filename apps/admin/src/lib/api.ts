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
		// Cache body parsed sang error._parsedBody trước khi ky throw — sau khi
		// throw, response.body có thể đã bị consume + clone() có thể fail. Cách
		// này extractError luôn đọc được payload BE (message + errors) thay vì
		// rơi xuống fallback generic theo HTTP status.
		beforeError: [
			async (state) => {
				const httpErr = state.error as Error & { response?: Response }
				if (httpErr.response) {
					try {
						const body = (await httpErr.response.clone().json()) as Partial<ApiError>
						;(httpErr as { _parsedBody?: Partial<ApiError> })._parsedBody = body
					} catch {
						// non-JSON body (vd HTML 500 page) — extractError sẽ fallback
					}
				}
				return httpErr
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
 * Trả message tiếng Việt cho HTTP status khi BE không kèm body.
 */
function vietnameseStatusMessage(status: number): string {
	if (status === 400) return "Yêu cầu không hợp lệ."
	if (status === 401) return "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại."
	if (status === 403) return "Bạn không có quyền thực hiện thao tác này."
	if (status === 404) return "Không tìm thấy tài nguyên."
	if (status === 409) return "Xung đột dữ liệu, vui lòng tải lại trang."
	if (status === 422) return "Dữ liệu không hợp lệ."
	if (status === 429) return "Quá nhiều yêu cầu, vui lòng thử lại sau."
	if (status >= 500) return "Lỗi máy chủ, vui lòng thử lại."
	return "Đã xảy ra lỗi không xác định."
}

/**
 * Đọc body lỗi từ ky error (cần await — ky không pre-parse body).
 * - Ưu tiên `message` + `errors` từ BE (đã localize sang tiếng Việt).
 * - Nếu BE không kèm body / parse fail → fallback theo status code.
 * - Nếu là lỗi mạng (không có response) → "Không kết nối được server".
 * Không bao giờ trả về raw `err.message` của ky vì đó là chuỗi tiếng Anh.
 */
/**
 * Tạo banner text cho form từ ApiError. Ưu tiên:
 *  1. Gộp tất cả field errors thành 1 chuỗi → admin thấy lý do cụ thể ngay.
 *  2. `message` từ BE nếu không có field errors.
 *  3. Fallback "Đã có lỗi" (hiếm khi tới — extractError đã guard).
 *
 * Dùng chung cho mọi form admin để FE hiển thị nhất quán + không giấu lỗi
 * BE đằng sau banner generic.
 */
export function formatApiErrorBanner(x: ApiError): string {
	const fieldText = x.errors ? Object.values(x.errors).flat().join(" • ") : ""
	return fieldText || x.message || "Đã có lỗi xảy ra."
}

export async function extractError(err: unknown): Promise<ApiError> {
	// Ưu tiên payload đã cache trong beforeError hook (đã parse 1 lần ngay
	// khi response về, an toàn với body đã consume).
	const cached = (err as { _parsedBody?: Partial<ApiError> })?._parsedBody
	const response = (err as { response?: Response })?.response

	if (cached && (cached.message || cached.errors)) {
		return {
			message: cached.message ?? vietnameseStatusMessage(response?.status ?? 0),
			errors: cached.errors,
		}
	}

	if (response && typeof response.clone === "function") {
		try {
			const data = (await response.clone().json()) as Partial<ApiError>
			if (data && (data.message || data.errors)) {
				return {
					message: data.message ?? vietnameseStatusMessage(response.status),
					errors: data.errors,
				}
			}
		} catch {
			// non-JSON body — fallthrough
		}
		return { message: vietnameseStatusMessage(response.status) }
	}

	return { message: "Không kết nối được server. Kiểm tra kết nối mạng và thử lại." }
}
