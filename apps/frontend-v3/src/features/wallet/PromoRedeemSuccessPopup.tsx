import { useEffect } from "react"
import { createPortal } from "react-dom"
import { Icon, StaticIcon } from "#/components/Icon"
import { cn, formatNumber } from "#/lib/utils"

interface Props {
	open: boolean
	coinsAdded: number
	newBalance: number
	onClose: () => void
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

const COIN_ANGLES = [0, 60, 120, 180, 240, 300]
const BURST_DIST = "170px"
const COIN_DIST = "120px"

export function PromoRedeemSuccessPopup({ open, coinsAdded, newBalance, onClose }: Props) {
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
			aria-label="Nhận mã quà tặng thành công"
		>
			<div className="card relative w-full max-w-md overflow-hidden text-center animate-[popIn_400ms_cubic-bezier(0.34,1.56,0.64,1)]">
				<button
					type="button"
					onClick={onClose}
					aria-label="Đóng"
					className="absolute top-3 right-3 z-10 p-2 rounded-full hover:bg-background transition"
				>
					<Icon name="close" size="sm" className="text-muted" />
				</button>

				<div className="relative overflow-hidden bg-gradient-to-b from-coin-tint to-transparent px-8 pb-3 pt-12">
					<p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary-dark">
						Đổi mã thành công
					</p>
					<h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">Chúc mừng bạn!</h2>
					<p className="mt-2 text-sm text-subtle">Lạc gửi xu cho bạn rồi nè — chiến đề thôi nào!</p>
				</div>

				<div className="relative mx-auto -mt-2 flex h-52 w-52 items-center justify-center">
					<span
						aria-hidden
						className="absolute inset-4 rounded-full bg-coin/25 animate-[coinPulseRing_1100ms_ease-out_forwards]"
					/>
					<span
						aria-hidden
						className="absolute inset-4 rounded-full bg-coin/15 animate-[coinPulseRing_1100ms_ease-out_220ms_forwards]"
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

					{COIN_ANGLES.map((angle) => (
						<span
							key={`coin-${angle}`}
							aria-hidden
							className="pointer-events-none absolute left-1/2 top-1/2"
							style={
								{
									"--angle": `${angle}deg`,
									"--dist": COIN_DIST,
									animation: "coinBurst 1300ms ease-out forwards",
									animationDelay: `${200 + (angle / 60) * 60}ms`,
								} as React.CSSProperties
							}
						>
							<StaticIcon name="coin" size="xs" className="h-5 w-auto drop-shadow-sm" />
						</span>
					))}

					<img
						src="/mascot/lac-happy.png"
						alt=""
						className="relative h-44 w-auto drop-shadow-[0_8px_0_rgba(71,135,0,0.18)] animate-[mascotBob_2.6s_ease-in-out_infinite]"
					/>

					<span
						aria-hidden
						className="absolute top-2 -right-4 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-coin text-coin-dark font-extrabold text-xl tabular-nums shadow-[0_3px_0_var(--color-coin-dark)] rotate-12 animate-[popIn_500ms_cubic-bezier(0.34,1.56,0.64,1)_320ms_both]"
					>
						+{formatNumber(coinsAdded)}
					</span>
				</div>

				<div className="space-y-4 px-8 pb-7 pt-4">
					<div className="flex items-center justify-center gap-2 rounded-(--radius-card) border-2 border-dashed border-border bg-background py-3 px-4">
						<StaticIcon name="coin" size="sm" />
						<span className="text-sm font-bold text-subtle">Số dư</span>
						<span className="text-base font-extrabold text-foreground tabular-nums">
							{formatNumber(newBalance)} xu
						</span>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="btn btn-primary w-full py-3.5 text-base font-extrabold uppercase tracking-wide"
					>
						Tuyệt vời!
					</button>
				</div>
			</div>
		</div>,
		document.body,
	)
}
