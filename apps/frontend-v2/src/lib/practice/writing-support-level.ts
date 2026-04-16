// Writing support level — 4 cấp độ hỗ trợ cho trang luyện viết.
// Pattern: module-level state + localStorage + CustomEvent (giống support-mode).

export type WritingSupportLevel = "off" | "hints" | "outline" | "template"

export interface WritingSupportLevelMeta {
	readonly value: WritingSupportLevel
	readonly label: string
	readonly description: string
}

export const WRITING_SUPPORT_LEVELS: readonly WritingSupportLevelMeta[] = [
	{ value: "off", label: "Tắt", description: "Không hiển thị gợi ý" },
	{ value: "hints", label: "Gợi ý", description: "Từ khóa + câu mẫu mở đầu" },
	{
		value: "outline",
		label: "Dàn ý + bài mẫu",
		description: "Cấu trúc 3 đoạn + bài mẫu tham khảo",
	},
	{ value: "template", label: "Điền vào mẫu", description: "Điền từ/cụm vào khung có sẵn" },
] as const

const STORAGE_KEY = "vstep.practice.writing-support-level"
const CHANGE_EVENT = "vstep:writing-support-level-change"

export function getWritingSupportLevel(): WritingSupportLevel {
	if (typeof window === "undefined") return "off"
	const raw = window.localStorage.getItem(STORAGE_KEY)
	if (raw === "hints" || raw === "outline" || raw === "template" || raw === "off") return raw
	return "off"
}

export function setWritingSupportLevel(level: WritingSupportLevel): void {
	if (typeof window === "undefined") return
	window.localStorage.setItem(STORAGE_KEY, level)
	window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function subscribeWritingSupportLevel(callback: () => void): () => void {
	window.addEventListener(CHANGE_EVENT, callback)
	function onStorage(e: StorageEvent) {
		if (e.key === STORAGE_KEY) callback()
	}
	window.addEventListener("storage", onStorage)
	return () => {
		window.removeEventListener(CHANGE_EVENT, callback)
		window.removeEventListener("storage", onStorage)
	}
}
