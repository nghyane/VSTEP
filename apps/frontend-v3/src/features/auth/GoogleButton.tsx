import { useEffect, useRef, useState } from "react"
import { loadGoogleIdentity } from "#/lib/google-identity"

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

interface Props {
	onToken: (idToken: string) => void
	text?: "signin_with" | "signup_with" | "continue_with"
	disabled?: boolean
}

export function GoogleButton({ onToken, text = "continue_with", disabled }: Props) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [error, setError] = useState(false)

	useEffect(() => {
		if (!CLIENT_ID || !containerRef.current) return
		const parent = containerRef.current
		let cancelled = false

		loadGoogleIdentity()
			.then(() => {
				if (cancelled) return
				const google = window.google?.accounts?.id
				if (!google) throw new Error("Google Identity not available")
				google.initialize({
					client_id: CLIENT_ID,
					callback: (resp) => {
						if (resp.credential) onToken(resp.credential)
					},
					auto_select: false,
					cancel_on_tap_outside: true,
				})
				parent.innerHTML = ""
				google.renderButton(parent, {
					type: "standard",
					theme: "outline",
					size: "large",
					text,
					shape: "rectangular",
					logo_alignment: "left",
					width: parent.offsetWidth || 360,
					locale: "vi",
				})
			})
			.catch(() => {
				if (!cancelled) setError(true)
			})

		return () => {
			cancelled = true
		}
	}, [onToken, text])

	if (!CLIENT_ID) {
		return (
			<div className="w-full h-12 flex items-center justify-center rounded-(--radius-button) border-2 border-border-light text-sm text-subtle font-bold">
				Google OAuth chưa được cấu hình
			</div>
		)
	}

	if (error) {
		return (
			<div className="w-full h-12 flex items-center justify-center rounded-(--radius-button) border-2 border-border-light text-sm text-subtle font-bold">
				Không tải được Google Sign-In
			</div>
		)
	}

	return (
		<div
			ref={containerRef}
			className={`w-full min-h-12 flex items-center justify-center ${disabled ? "pointer-events-none opacity-60" : ""}`}
		/>
	)
}
