import { useCallback, useEffect, useRef, useState } from "react"
import { StaticIcon } from "#/components/Icon"

export const COIN_SPEND_FX_MS = 900

interface Props {
	cost: number
}

export function CoinSpendFly({ cost }: Props) {
	return (
		<span
			aria-hidden
			className="pointer-events-none absolute left-1/2 -top-2 z-10 inline-flex w-max items-center gap-1.5 rounded-full bg-coin px-3 py-1.5 text-xs font-extrabold text-coin-dark shadow-md tabular-nums animate-[coinFlyUp_900ms_cubic-bezier(0.34,1.56,0.64,1)_forwards]"
		>
			<StaticIcon name="coin" size="xs" className="h-3.5 w-auto -translate-y-0.5" />-{cost} xu
		</span>
	)
}

export function useCoinSpendFly() {
	const [showCoinFly, setShowCoinFly] = useState(false)
	const timerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)

	const triggerCoinSpendFly = useCallback(() => {
		if (timerRef.current !== null) {
			window.clearTimeout(timerRef.current)
		}

		setShowCoinFly(true)
		timerRef.current = window.setTimeout(() => {
			setShowCoinFly(false)
			timerRef.current = null
		}, COIN_SPEND_FX_MS)
	}, [])

	useEffect(() => {
		return () => {
			if (timerRef.current !== null) {
				window.clearTimeout(timerRef.current)
			}
		}
	}, [])

	return { showCoinFly, triggerCoinSpendFly }
}
