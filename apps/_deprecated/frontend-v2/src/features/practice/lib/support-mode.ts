// Support mode — toggle hỗ trợ gợi ý cụm từ khi luyện 4 kỹ năng.
// Lưu ở localStorage, broadcast qua CustomEvent để React rerender.

export const SUPPORT_MODE_STORAGE_KEY = "vstep.practice.support-mode"
const CHANGE_EVENT = "vstep:support-mode-change"

export function getSupportMode(): boolean {
	if (typeof window === "undefined") return false
	return window.localStorage.getItem(SUPPORT_MODE_STORAGE_KEY) === "true"
}

export function setSupportMode(enabled: boolean): void {
	if (typeof window === "undefined") return
	window.localStorage.setItem(SUPPORT_MODE_STORAGE_KEY, String(enabled))
	window.dispatchEvent(new Event(CHANGE_EVENT))
}
