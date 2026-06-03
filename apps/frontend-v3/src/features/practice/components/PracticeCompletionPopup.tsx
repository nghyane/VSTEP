import { Link } from "@tanstack/react-router"
import { createPortal } from "react-dom"

interface Props {
	open: boolean
	backTo: "/luyen-tap/nghe" | "/luyen-tap/doc"
	onKeepReviewing: () => void
}

export function PracticeCompletionPopup({ open, backTo, onKeepReviewing }: Props) {
	if (!open || typeof document === "undefined") return null

	return createPortal(
		<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
			<div className="w-full max-w-md rounded-[32px] bg-surface px-8 py-10 text-center shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
				<div className="text-5xl" aria-hidden>
					🎉
				</div>
				<h2 className="mt-5 text-2xl font-extrabold leading-tight text-foreground">
					Chúc mừng! Bạn đã hoàn thành bài luyện tập này.
				</h2>
				<p className="mt-4 text-base font-semibold text-muted">Bạn có muốn quay về danh sách không?</p>
				<div className="mt-8 grid grid-cols-2 gap-4">
					<button
						type="button"
						onClick={onKeepReviewing}
						className="min-h-14 rounded-2xl border-2 border-border bg-surface px-4 text-sm font-extrabold text-muted shadow-[0_5px_0_var(--color-border)] transition active:translate-y-[3px] active:shadow-[0_2px_0_var(--color-border)]"
					>
						Tiếp tục xem lại
					</button>
					<Link
						to={backTo}
						className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-success px-4 text-sm font-extrabold text-primary-foreground shadow-[0_5px_0_color-mix(in_oklch,var(--color-success)_70%,black)] transition active:translate-y-[3px] active:shadow-[0_2px_0_color-mix(in_oklch,var(--color-success)_70%,black)]"
					>
						Có, quay về
					</Link>
				</div>
			</div>
		</div>,
		document.body,
	)
}
