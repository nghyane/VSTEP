import { X } from "lucide-react"
import { useCallback, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { cn } from "#/lib/utils"

interface Props {
	open: boolean
	onClose: () => void
	title?: string
	description?: string
	children: React.ReactNode
	size?: "sm" | "md" | "lg"
}

const sizes = {
	sm: "max-w-sm",
	md: "max-w-lg",
	lg: "max-w-2xl",
}

export function Modal({ open, onClose, title, description, children, size = "md" }: Props) {
	const dialogRef = useRef<HTMLDivElement>(null)

	const handleEscape = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Escape") onClose()
		},
		[onClose],
	)

	useEffect(() => {
		if (open) {
			document.addEventListener("keydown", handleEscape)
			document.body.style.overflow = "hidden"
		}
		return () => {
			document.removeEventListener("keydown", handleEscape)
			document.body.style.overflow = ""
		}
	}, [open, handleEscape])

	if (!open) return null

	return createPortal(
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby={title ? "modal-title" : undefined}
			className="fixed inset-0 z-50 flex items-center justify-center"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose()
			}}
		>
			<div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm" />
			<div
				ref={dialogRef}
				className={cn(
					"relative z-10 w-full rounded-(--radius-card) border border-border bg-surface shadow-lg",
					sizes[size],
					"mx-4 max-h-[90vh] overflow-y-auto",
				)}
			>
				{(title || description) && (
					<div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
						<div>
							{title && (
								<h2 id="modal-title" className="text-base font-semibold text-foreground">
									{title}
								</h2>
							)}
							{description && <p className="mt-1 text-sm text-muted">{description}</p>}
						</div>
						<button
							type="button"
							aria-label="Đóng"
							className="shrink-0 rounded-md p-1 text-muted hover:bg-surface-muted hover:text-foreground"
							onClick={onClose}
						>
							<X className="size-4" />
						</button>
					</div>
				)}
				<div className="p-6">{children}</div>
			</div>
		</div>,
		document.body,
	)
}
