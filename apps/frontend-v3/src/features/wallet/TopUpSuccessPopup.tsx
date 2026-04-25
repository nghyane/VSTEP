import { useEffect } from "react"
import { createPortal } from "react-dom"
import { Icon, StaticIcon } from "#/components/Icon"
import { formatNumber } from "#/lib/utils"

interface Props {
	open: boolean
	coinsAdded: number
	newBalance: number
	onClose: () => void
}

const BURST_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]
const BURST_DIST = 130

export function TopUpSuccessPopup({ open, coinsAdded, newBalance, onClose }: Props) {
	useEffect(() => {
		if (!open) return
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [open, onClose])

	if (!open) return null
	if (typeof document === "undefined") return null

	return createPortal(
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_200ms_ease-out] p-4"
			role="dialog"
			aria-modal="true"
			aria-label="Nạp xu thành công"
		>
			<div className="card relative w-full max-w-sm overflow-hidden text-center animate-[popIn_400ms_cubic-bezier(0.34,1.56,0.64,1)]">
				<button
					type="button"
					onClick={onClose}
					aria-label="Đóng"
					className="absolute top-3 right-3 p-2 rounded-full hover:bg-background transition z-10"
				>
					<Icon name="close" size="sm" className="text-muted" />
				</button>

				<div className="relative bg-gradient-to-b from-coin-tint to-transparent px-8 pt-10 pb-6">
					<p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary-dark">
						Nạp xu thành công
					</p>
					<h2 className="mt-2 text-4xl font-extrabold text-foreground tracking-tight">Ting ting!</h2>
					<p className="mt-2 text-sm text-subtle">Xu đã sẵn sàng — chiến đề thôi nào.</p>
				</div>

				<div className="px-8 pb-8 pt-2">
					<div className="relative mx-auto flex h-40 w-40 items-center justify-center">
						<span
							aria-hidden
							className="absolute inset-0 rounded-full bg-coin/25 animate-[coinPulseRing_900ms_ease-out_forwards]"
						/>
						<span
							aria-hidden
							className="absolute inset-0 rounded-full bg-coin/15 animate-[coinPulseRing_900ms_ease-out_220ms_forwards]"
						/>
						{BURST_ANGLES.map((angle) => (
							<span
								key={angle}
								aria-hidden
								className="pointer-events-none absolute left-1/2 top-1/2"
								style={
									{
										"--angle": `${angle}deg`,
										"--dist": `${BURST_DIST}px`,
										animation: "coinBurst 1200ms ease-out forwards",
										animationDelay: "140ms",
									} as React.CSSProperties
								}
							>
								<StaticIcon name="coin" size="xs" className="h-4 w-auto drop-shadow-sm" />
							</span>
						))}
						<StaticIcon
							name="coin-md"
							size="xl"
							className="relative h-32 w-auto drop-shadow-[0_8px_0_rgba(217,119,6,0.25)] animate-[coinPinch_700ms_ease-in-out_120ms]"
						/>
						<span
							aria-hidden
							className="absolute -top-1 -right-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-coin text-coin-dark font-extrabold text-xl tabular-nums shadow-[0_3px_0_var(--color-coin-dark)] rotate-6 animate-[popIn_500ms_cubic-bezier(0.34,1.56,0.64,1)_280ms_both]"
						>
							+{formatNumber(coinsAdded)}
						</span>
					</div>

					<div className="mt-6 flex items-center justify-center gap-2 rounded-(--radius-card) border-2 border-dashed border-border bg-background py-3 px-4">
						<StaticIcon name="coin" size="sm" />
						<span className="text-sm font-bold text-subtle">Số dư</span>
						<span className="text-base font-extrabold text-foreground tabular-nums">
							{formatNumber(newBalance)} xu
						</span>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="btn btn-primary mt-6 w-full py-3.5 text-base font-extrabold uppercase tracking-wide"
					>
						Học thôi nào!
					</button>
				</div>
			</div>
		</div>,
		document.body,
	)
}
