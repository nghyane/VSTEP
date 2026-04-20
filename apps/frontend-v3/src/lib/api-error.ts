export function getApiError(error: unknown): string {
	if (error && typeof error === "object") {
		const e = error as { data?: { errors?: Record<string, string[]>; message?: string } }
		if (e.data?.errors) {
			const first = Object.values(e.data.errors).flat()[0]
			if (typeof first === "string") return first
		}
		if (e.data?.message) return e.data.message
	}
	return "Đã có lỗi xảy ra. Vui lòng thử lại."
}
