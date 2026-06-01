// Shared hook cho support mode — subscribe vào localStorage + CustomEvent.
// Dùng ở SupportModeSwitch và các session hook (listening/reading/…).

import { useEffect, useSyncExternalStore } from "react"
import { getSupportMode, SUPPORT_MODE_STORAGE_KEY, setSupportMode } from "./support-mode"

export function useSupportMode(): boolean {
	return useSyncExternalStore(subscribe, getSupportMode, () => false)
}

/**
 * Reset support mode về OFF mỗi khi user vào 1 phiên luyện tập mới.
 * Gọi ở top của SessionView để mỗi lần start session đều tắt hỗ trợ.
 */
export function useResetSupportModeOnMount(): void {
	useEffect(() => {
		setSupportMode(false)
	}, [])
}

function subscribe(callback: () => void): () => void {
	function onStorage(e: StorageEvent) {
		if (e.key === SUPPORT_MODE_STORAGE_KEY) callback()
	}
	window.addEventListener("storage", onStorage)
	window.addEventListener("vstep:support-mode-change", callback)
	return () => {
		window.removeEventListener("storage", onStorage)
		window.removeEventListener("vstep:support-mode-change", callback)
	}
}
