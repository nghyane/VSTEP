// Animated coin icon dùng Lottie — auto-play loop.
// Cache animation data ở module level để nhiều instance không refetch.

import Lottie from "lottie-react"
import { useEffect, useState } from "react"
import { CoinIcon } from "./CoinIcon"

let cachedData: object | null = null
let pendingPromise: Promise<object> | null = null

function loadCoinAnim(): Promise<object> {
	if (cachedData) return Promise.resolve(cachedData)
	if (pendingPromise) return pendingPromise
	pendingPromise = fetch("/coin.json")
		.then((r) => r.json())
		.then((data: object) => {
			cachedData = data
			return data
		})
	return pendingPromise
}

interface Props {
	size?: number
	className?: string
}

export function AnimatedCoinIcon({ size = 20, className }: Props) {
	const [animData, setAnimData] = useState<object | null>(cachedData)

	useEffect(() => {
		if (animData) return
		let cancelled = false
		loadCoinAnim().then((data) => {
			if (!cancelled) setAnimData(data)
		})
		return () => {
			cancelled = true
		}
	}, [animData])

	if (!animData) {
		return <CoinIcon size={size} className={className} />
	}

	return (
		<Lottie
			animationData={animData}
			loop
			autoplay
			className={className}
			style={{ width: size, height: size }}
		/>
	)
}
