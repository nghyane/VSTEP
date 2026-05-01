import { useEffect } from "react"
import { createPortal } from "react-dom"

interface Props {
	open: boolean
	title?: string
	message?: string
	loading?: boolean
	onClose: () => void
	onRetry?: () => void
}

export function EnrollFailurePopup({ open, title, message, loading, onClose, onRetry }: Props) {
	useEffect(() => {
		if (!open) return
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [open, onClose])

	if (!open || typeof document === "undefined") return null

	return createPortal(
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-[fadeIn_220ms_ease-out]"
			role="dialog"
			aria-modal="true"
			aria-label="Đăng ký khóa học không thành công"
		>
			<div className="card relative w-full max-w-md overflow-hidden text-center animate-[popIn_400ms_cubic-bezier(0.34,1.56,0.64,1)]">
				<div className="relative overflow-hidden bg-gradient-to-b from-destructive-tint to-transparent px-8 pb-3 pt-12">
					<p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-destructive">
						Đăng ký không thành công
					</p>
					<h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
						{title ?? "Có chuyện rồi…"}
					</h2>
					<p className="mt-2 text-sm text-subtle">
						{message ?? "Hệ thống đang bận. Vui lòng thử lại sau ít phút."}
					</p>
				</div>

				<div className="relative mx-auto flex h-48 w-48 items-center justify-center">
					<span aria-hidden className="absolute h-32 w-32 rounded-full bg-destructive/10 blur-xl" />
					<span
						aria-hidden
						className="pointer-events-none absolute left-1/2 top-12 size-2 -translate-x-1/2 rounded-full bg-info opacity-0 animate-[tearDrop_2.4s_ease-in_700ms_infinite]"
					/>
					<img
						src="/mascot/lac-sad.png"
						alt=""
						className="relative h-40 w-auto drop-shadow-[0_6px_0_rgba(234,67,53,0.15)]"
						style={{
							animation:
								"mascotSadShake 600ms ease-in-out 200ms 1, mascotSadSway 3.4s ease-in-out 800ms infinite",
						}}
					/>
				</div>

				<div className="space-y-2.5 px-8 pb-7 pt-2">
					{onRetry && (
						<button
							type="button"
							onClick={onRetry}
							disabled={loading}
							className="btn btn-primary w-full py-3.5 text-base font-extrabold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-60"
						>
							{loading ? "Đang xử lý…" : "Thử lại"}
						</button>
					)}
					<button
						type="button"
						onClick={onClose}
						disabled={loading}
						className="w-full rounded-(--radius-button) border-2 border-b-4 border-border bg-surface py-3 text-sm font-extrabold text-foreground transition-all hover:border-primary/40 active:translate-y-[2px] active:border-b-2 disabled:opacity-60"
					>
						Đóng
					</button>
				</div>
			</div>
		</div>,
		document.body,
	)
}
