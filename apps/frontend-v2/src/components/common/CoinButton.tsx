import Lottie, { type LottieRefCurrentProps } from "lottie-react"
import { useRef, useState } from "react"
import { CoinIcon } from "./CoinIcon"

const COIN_COUNT = 100

export function CoinButton() {
	const lottieRef = useRef<LottieRefCurrentProps>(null)
	const [hovered, setHovered] = useState(false)
	const [animData, setAnimData] = useState<object | null>(null)

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
			aria-label={`${COIN_COUNT} xu`}
			className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm font-semibold text-amber-600 transition-colors hover:bg-muted cursor-default"
			onMouseEnter={handleMouseEnter}
			onMouseLeave={() => setHovered(false)}
		>
			<span className="flex size-5 shrink-0 items-center justify-center overflow-hidden">
				{hovered && animData ? (
					<Lottie lottieRef={lottieRef} animationData={animData} loop autoplay className="size-5" />
				) : (
					<CoinIcon size={20} />
				)}
			</span>
			<span className="text-sm font-semibold leading-none">{COIN_COUNT}</span>
		</output>
	)
}
