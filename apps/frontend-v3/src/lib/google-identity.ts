interface GoogleCredentialResponse {
	credential: string
}

interface GsiButtonConfig {
	type?: "standard" | "icon"
	theme?: "outline" | "filled_blue" | "filled_black"
	size?: "large" | "medium" | "small"
	text?: "signin_with" | "signup_with" | "continue_with" | "signin"
	shape?: "rectangular" | "pill" | "circle" | "square"
	logo_alignment?: "left" | "center"
	width?: number
	locale?: string
}

interface GoogleAccountsId {
	initialize: (config: {
		client_id: string
		callback: (resp: GoogleCredentialResponse) => void
		auto_select?: boolean
		cancel_on_tap_outside?: boolean
	}) => void
	renderButton: (parent: HTMLElement, options: GsiButtonConfig) => void
	prompt: () => void
	cancel: () => void
	disableAutoSelect: () => void
}

declare global {
	interface Window {
		google?: {
			accounts: {
				id: GoogleAccountsId
			}
		}
	}
}

const GSI_SRC = "https://accounts.google.com/gsi/client"

let loaderPromise: Promise<void> | null = null

export function loadGoogleIdentity(): Promise<void> {
	if (typeof window === "undefined") return Promise.reject(new Error("SSR"))
	if (window.google?.accounts?.id) return Promise.resolve()
	if (loaderPromise) return loaderPromise

	loaderPromise = new Promise((resolve, reject) => {
		const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`)
		if (existing) {
			if (window.google?.accounts?.id) {
				resolve()
				return
			}
			existing.addEventListener("load", () => resolve(), { once: true })
			existing.addEventListener("error", () => reject(new Error("GSI load failed")), {
				once: true,
			})
			return
		}
		const script = document.createElement("script")
		script.src = GSI_SRC
		script.async = true
		script.defer = true
		script.onload = () => resolve()
		script.onerror = () => reject(new Error("GSI load failed"))
		document.head.appendChild(script)
	})

	return loaderPromise
}
