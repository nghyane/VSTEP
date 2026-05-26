import { notification } from "antd"

export function Toaster() {
	return null
}

export function showSuccess(text: string, description?: string) {
	notification.success({ message: text, description, duration: 3 })
}

export function showError(text: string, description?: string) {
	notification.error({ message: text, description, duration: 5 })
}

export function showInfo(text: string, description?: string) {
	notification.info({ message: text, description, duration: 3 })
}
