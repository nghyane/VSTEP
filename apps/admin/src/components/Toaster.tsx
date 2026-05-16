import { message } from "antd"

export function Toaster() {
	return null
}

export function showSuccess(text: string, description?: string) {
	message.success(description ? `${text} — ${description}` : text)
}

export function showError(text: string, description?: string) {
	message.error(description ? `${text} — ${description}` : text)
}

export function showInfo(text: string, description?: string) {
	message.info(description ? `${text} — ${description}` : text)
}
