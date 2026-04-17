import Lottie, { type LottieRefCurrentProps } from "lottie-react"
import { Plus } from "lucide-react"
import { useRef, useState } from "react"
import { useCoins } from "#/lib/coins/coin-store"
import { cn } from "#/lib/utils"
import { CoinIcon } from "./CoinIcon"
import { TopUpDialog } from "./TopUpDialog"

export function CoinButton() {
	const lottieRef = useRef<LottieRefCurrentProps>(null)
	const [hovered, setHovered] = useState(false)
	const [animData, setAnimData] = useState<object | null>(null)
	const [topUpOpen, setTopUpOpen] = useState(false)
	const coins = useCoins()
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
			<button
				type="button"
				aria-label={`${coins} xu — bấm để nạp thêm`}
				onClick={() => setTopUpOpen(true)}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={() => setHovered(false)}
				className={cn(
					"group inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm font-semibold transition-colors hover:bg-muted",
					isEmpty ? "text-muted-foreground" : "text-amber-600",
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
				<span className="text-sm font-semibold leading-none tabular-nums">{coins}</span>
				<Plus className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
			</button>
			<TopUpDialog open={topUpOpen} onOpenChange={setTopUpOpen} />
		</>
	)
}
