import Lottie, { type LottieRefCurrentProps } from "lottie-react"
import { useRef, useState } from "react"
import { useCoins } from "#/lib/coins/coin-store"
import { CoinIcon } from "./CoinIcon"

export function CoinButton() {
	const lottieRef = useRef<LottieRefCurrentProps>(null)
	const [hovered, setHovered] = useState(false)
	const [animData, setAnimData] = useState<object | null>(null)
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
		<output
			aria-label={`${coins} xu`}
			className={`inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm font-semibold transition-colors hover:bg-muted cursor-default ${
				isEmpty ? "text-muted-foreground" : "text-amber-600"
			}`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={() => setHovered(false)}
		>
			<span className="flex size-5 shrink-0 items-center justify-center overflow-hidden">
				{hovered && animData ? (
					<Lottie lottieRef={lottieRef} animationData={animData} loop autoplay className="size-5" />
				) : (
					<CoinIcon size={20} className={isEmpty ? "opacity-50 grayscale" : undefined} />
				)}
			</span>
			<span className="text-sm font-semibold leading-none tabular-nums">{coins}</span>
		</output>
	)
}
