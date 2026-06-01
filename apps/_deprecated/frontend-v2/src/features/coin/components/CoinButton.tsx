import Lottie, { type LottieRefCurrentProps } from "lottie-react"
import { Plus } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useCoins } from "#/features/coin/lib/coin-store"
import { cn } from "#/shared/lib/utils"
import { CoinIcon } from "./CoinIcon"
import { TopUpDialog } from "./TopUpDialog"

const FLOAT_DURATION_MS = 1800

function formatCoins(n: number): string {
	return n.toLocaleString("vi-VN")
}

/**
 * Detect mỗi khi balance tăng (refund / bonus / topup) và trả về delta gần nhất.
 * Mỗi lần tăng tạo 1 entry mới với id unique → caller dùng làm key cho floating badge.
 */
function useCoinIncrease(coins: number): { id: number; delta: number } | null {
	const prevRef = useRef(coins)
	const [event, setEvent] = useState<{ id: number; delta: number } | null>(null)

	useEffect(() => {
		const prev = prevRef.current
		if (coins > prev) {
			setEvent({ id: Date.now(), delta: coins - prev })
		}
		prevRef.current = coins
	}, [coins])

	useEffect(() => {
		if (!event) return
		const t = window.setTimeout(() => setEvent(null), FLOAT_DURATION_MS)
		return () => window.clearTimeout(t)
	}, [event])

	return event
}

export function CoinButton() {
	const lottieRef = useRef<LottieRefCurrentProps>(null)
	const [hovered, setHovered] = useState(false)
	const [animData, setAnimData] = useState<object | null>(null)
	const [topUpOpen, setTopUpOpen] = useState(false)
	const coins = useCoins()
	const increase = useCoinIncrease(coins)
	const isEmpty = coins <= 0

	function handleMouseEnter() {
		setHovered(true)
		if (!animData) {
			fetch("/coin.json")
				.then((r) => r.json())
				.then(setAnimData)
		} else {
			lottieRef.current?.goToAndPlay(0)
		}
	}

	return (
		<>
			<div className="relative">
				<button
					type="button"
					aria-label={`${formatCoins(coins)} xu — bấm để nạp thêm`}
					onClick={() => setTopUpOpen(true)}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={() => setHovered(false)}
					className={cn(
						"group inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm font-semibold transition-[background-color,transform] hover:bg-muted",
						isEmpty ? "text-muted-foreground" : "text-amber-600",
						increase && "animate-coin-pulse",
					)}
				>
					<span className="flex size-5 shrink-0 items-center justify-center overflow-hidden">
						{hovered && animData ? (
							<Lottie
								lottieRef={lottieRef}
								animationData={animData}
								loop
								autoplay
								className="size-5"
							/>
						) : (
							<CoinIcon size={20} className={isEmpty ? "opacity-50 grayscale" : undefined} />
						)}
					</span>
					<span className="flex h-5 items-center text-sm font-semibold leading-none tabular-nums">
						<span className="translate-y-[1px]">{formatCoins(coins)}</span>
					</span>
					<span className="flex size-3 shrink-0 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
						<Plus className="size-3 text-muted-foreground" />
					</span>
				</button>

				{/* Floating +N xu indicator khi balance tăng */}
				{increase && (
					<span
						key={increase.id}
						className="pointer-events-none absolute left-1/2 top-0 z-50 -translate-x-1/2 animate-coin-float select-none whitespace-nowrap rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white shadow-lg"
						aria-hidden
					>
						+{formatCoins(increase.delta)} xu
					</span>
				)}
			</div>
			<TopUpDialog open={topUpOpen} onOpenChange={setTopUpOpen} />
		</>
	)
}
