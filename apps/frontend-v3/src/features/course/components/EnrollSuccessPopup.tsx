import { useEffect } from "react"
import { createPortal } from "react-dom"
import { StaticIcon } from "#/components/Icon"
import { cn, formatNumber } from "#/lib/utils"

interface Props {
	open: boolean
	courseTitle: string
	bonusCoins: number
	onClose: () => void
	onContinue?: () => void
}

const CONFETTI = [
	{ angle: 15, color: "bg-primary", size: "size-2.5" },
	{ angle: 45, color: "bg-coin", size: "size-2" },
	{ angle: 75, color: "bg-info", size: "size-2.5" },
	{ angle: 105, color: "bg-streak", size: "size-3" },
	{ angle: 135, color: "bg-warning", size: "size-2" },
	{ angle: 165, color: "bg-primary-light", size: "size-2.5" },
	{ angle: 195, color: "bg-coin", size: "size-2" },
	{ angle: 225, color: "bg-info", size: "size-3" },
	{ angle: 255, color: "bg-streak", size: "size-2.5" },
	{ angle: 285, color: "bg-primary", size: "size-2" },
	{ angle: 315, color: "bg-coin-light", size: "size-3" },
	{ angle: 345, color: "bg-warning", size: "size-2.5" },
]

const BURST_DIST = "160px"

export function EnrollSuccessPopup({ open, courseTitle, bonusCoins, onClose, onContinue }: Props) {
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
			aria-label="Đăng ký khóa học thành công"
		>
			<div className="card relative w-full max-w-md overflow-hidden text-center animate-[popIn_400ms_cubic-bezier(0.34,1.56,0.64,1)]">
				<div className="relative overflow-hidden bg-gradient-to-b from-primary-tint to-transparent px-8 pb-3 pt-12">
					<p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary-dark">
						Đăng ký thành công
					</p>
					<h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
						Chào mừng học viên mới!
					</h2>
					<p className="mt-2 text-sm text-subtle">Khóa học đã sẵn sàng — chiến thôi nào!</p>
				</div>

				<div className="relative mx-auto -mt-2 flex h-48 w-48 items-center justify-center">
					<span
						aria-hidden
						className="absolute inset-4 rounded-full bg-primary/20 animate-[coinPulseRing_1100ms_ease-out_forwards]"
					/>
					<span
						aria-hidden
						className="absolute inset-4 rounded-full bg-primary/10 animate-[coinPulseRing_1100ms_ease-out_220ms_forwards]"
					/>
					{CONFETTI.map((c) => (
						<span
							key={c.angle}
							aria-hidden
							className={cn("pointer-events-none absolute left-1/2 top-1/2 rounded-sm", c.size, c.color)}
							style={
								{
									"--angle": `${c.angle}deg`,
									"--dist": BURST_DIST,
									animation: "coinBurst 1500ms ease-out forwards",
									animationDelay: `${120 + (c.angle / 30) * 25}ms`,
								} as React.CSSProperties
							}
						/>
					))}
					<img
						src="/mascot/lac-happy.png"
						alt=""
						className="relative h-40 w-auto drop-shadow-[0_8px_0_rgba(71,135,0,0.18)] animate-[mascotBob_2.6s_ease-in-out_infinite]"
					/>
				</div>

				<div className="space-y-4 px-8 pb-7 pt-2">
					<div className="space-y-1 rounded-(--radius-card) border-2 border-dashed border-border bg-background px-4 py-3.5">
						<p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">Khóa học</p>
						<p className="text-sm font-extrabold text-foreground">{courseTitle}</p>
						{bonusCoins > 0 && (
							<p className="flex items-center justify-center gap-1 pt-1 text-xs font-bold text-coin-dark">
								<StaticIcon name="coin" size="xs" className="h-3.5 w-auto" />+{formatNumber(bonusCoins)} xu
								thưởng đã vào ví
							</p>
						)}
					</div>

					<button
						type="button"
						onClick={onContinue ?? onClose}
						className="btn btn-primary w-full py-3.5 text-base font-extrabold uppercase tracking-wide"
					>
						Vào học ngay
					</button>
				</div>
			</div>
		</div>,
		document.body,
	)
}
