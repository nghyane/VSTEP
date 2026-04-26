import { type ReactNode, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { cn } from "#/lib/utils"

interface Props {
	open: boolean
	title: string
	description: ReactNode
	warning?: string
	confirmLabel: string
	cancelLabel?: string
	loadingLabel?: string
	onConfirm: () => void
	onCancel: () => void
	isLoading?: boolean
	countdownSeconds?: number
	destructive?: boolean
}

/**
 * Reusable confirm dialog with warning icon, optional countdown lock on the
 * confirm button, optional destructive styling. Backdrop + close button + Cancel
 * all trigger onCancel. See anti-patterns.md for when to use.
 */
export function ConfirmDialog({
	open,
	title,
	description,
	warning,
	confirmLabel,
	cancelLabel = "Ở lại",
	loadingLabel = "Đang xử lý…",
	onConfirm,
	onCancel,
	isLoading,
	countdownSeconds,
	destructive,
}: Props) {
	const [remaining, setRemaining] = useState(countdownSeconds ?? 0)

	useEffect(() => {
		if (!open || !countdownSeconds) {
			setRemaining(0)
			return
		}
		setRemaining(countdownSeconds)
		const t = setInterval(() => {
			setRemaining((r) => {
				if (r <= 1) {
					clearInterval(t)
					return 0
				}
				return r - 1
			})
		}, 1000)
		return () => clearInterval(t)
	}, [open, countdownSeconds])

	if (!open) return null
	if (typeof document === "undefined") return null
	const locked = remaining > 0

	// Portal ra body để thoát mọi containing block (vd. `backdrop-filter` trên parent
	// biến `fixed` thành "fixed trong phạm vi parent" → dialog bị cắt / lệch).
	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center p-6">
			<button
				type="button"
				aria-label="Đóng"
				onClick={onCancel}
				className="absolute inset-0 bg-foreground/45 backdrop-blur-sm"
			/>
			<div className="relative w-full max-w-sm rounded-(--radius-card) border-2 border-b-4 border-border bg-card p-6 shadow-[0_12px_28px_rgb(0_0_0_/_0.12)] animate-[slideIn_0.18s_ease-out]">
				<button
					type="button"
					onClick={onCancel}
					className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground"
					aria-label="Đóng"
				>
					<svg
						viewBox="0 0 16 16"
						className="size-4"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.2"
						strokeLinecap="round"
						aria-hidden="true"
					>
						<path d="M3 3l10 10M13 3L3 13" />
					</svg>
				</button>

				<div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border-2 border-b-4 border-warning/30 bg-warning-tint">
					<svg
						viewBox="0 0 24 24"
						className="size-7 text-warning"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.2"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
						<line x1="12" y1="9" x2="12" y2="13" />
						<line x1="12" y1="17" x2="12.01" y2="17" />
					</svg>
				</div>

				<h2 className="mb-1.5 text-center text-lg font-extrabold text-foreground">{title}</h2>
				<p className="mb-5 text-center text-sm leading-relaxed text-muted">{description}</p>

				{warning && (
					<div className="mb-5 flex items-center justify-center gap-2 rounded-(--radius-button) border-2 border-warning/30 bg-warning-tint px-3 py-2 text-center text-xs font-extrabold text-warning">
						<span
							aria-hidden="true"
							className="flex size-4 shrink-0 items-center justify-center rounded-full bg-warning text-[10px] font-black text-white"
						>
							!
						</span>
						{warning}
					</div>
				)}

				<div className="flex gap-2.5">
					<button
						type="button"
						onClick={onCancel}
						className="flex-1 rounded-(--radius-button) border-2 border-b-4 border-border bg-surface px-4 py-2.5 text-sm font-extrabold text-foreground transition-all hover:border-primary/40 active:translate-y-[2px] active:border-b-2"
					>
						{cancelLabel}
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={isLoading || locked}
						className={cn(
							"flex-1 text-sm disabled:cursor-not-allowed disabled:opacity-60",
							destructive
								? "rounded-(--radius-button) border-2 border-b-4 border-destructive bg-destructive px-4 py-2.5 font-extrabold text-white transition-all hover:brightness-110 active:translate-y-[2px] active:border-b-2"
								: "btn btn-primary",
						)}
					>
						{isLoading ? loadingLabel : locked ? `${confirmLabel} (${remaining})` : confirmLabel}
					</button>
				</div>
			</div>
		</div>,
		document.body,
	)
}
