// Mascot Lạc cầm đồng xu với score thang 10 overlay.
// Ảnh gốc đã được xử lý remove background (lac-coin-nobg.png).
//
// Hiệu ứng: khi mount, số điểm tween từ 0 → score (easeOutCubic, ~1.4s)
// và một burst pháo hoa nhỏ (dùng keyframe `coinBurst` trong styles.css)
// toả ra từ tâm đồng xu.

import { useEffect, useState } from "react"
import { cn } from "#/lib/utils"

// Tọa độ tâm đồng xu (% so với kích thước ảnh gốc 1413×1113).
const COIN_CENTER_X = 67
const COIN_CENTER_Y = 55

// Confetti particles — toả đều 360°, màu rực rỡ.
const CONFETTI_COLORS = [
	"#58cc02", // primary
	"#1cb0f6", // info
	"#ffc800", // coin
	"#ff7800", // streak
	"#ea4335", // destructive
	"#7850c8", // reading
]
const CONFETTI_COUNT = 14

interface Props {
	score: number
	className?: string
}

function useCountUp(target: number, durationMs = 1400): number {
	const [value, setValue] = useState(0)
	useEffect(() => {
		let raf = 0
		const start = performance.now()
		const tick = (now: number) => {
			const t = Math.min(1, (now - start) / durationMs)
			const eased = 1 - (1 - t) ** 3 // easeOutCubic
			setValue(target * eased)
			if (t < 1) raf = requestAnimationFrame(tick)
		}
		raf = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(raf)
	}, [target, durationMs])
	return value
}

export function LacCoinMascot({ score, className }: Props) {
	const animated = useCountUp(score)
	const scoreLabel = animated.toFixed(1)

	return (
		<div className={cn("relative inline-block select-none", className)}>
			<div className="relative w-full" style={{ isolation: "isolate" }}>
				<img
					src="/mascot/lac-coin-nobg.png"
					alt="Mascot Lạc VSTEP"
					className="w-full object-contain"
					draggable={false}
				/>
			</div>

			<span className="sr-only">Điểm: {score.toFixed(1)}/10</span>

			{/* Confetti burst từ tâm đồng xu */}
			<div
				aria-hidden
				className="pointer-events-none absolute"
				style={{
					top: `${COIN_CENTER_Y}%`,
					left: `${COIN_CENTER_X}%`,
					width: 0,
					height: 0,
				}}
			>
				{Array.from({ length: CONFETTI_COUNT }).map((_, i) => {
					const angle = (360 / CONFETTI_COUNT) * i + (i % 2 === 0 ? 0 : 12)
					const dist = 70 + ((i * 13) % 50) // 70–120px, đa dạng
					const delay = (i % 5) * 40 // stagger 0–160ms
					const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
					const size = 6 + ((i * 3) % 5) // 6–10px
					return (
						<span
							key={i}
							className="absolute rounded-sm"
							style={
								{
									top: 0,
									left: 0,
									width: size,
									height: size,
									background: color,
									opacity: 0,
									transform: "translate(-50%, -50%)",
									animation: `coinBurst 1200ms ease-out ${delay}ms forwards`,
									"--angle": `${angle}deg`,
									"--dist": `${dist}px`,
								} as React.CSSProperties
							}
						/>
					)
				})}
			</div>

			{/* Score overlay tại tâm đồng xu */}
			<div
				aria-hidden
				className="pointer-events-none absolute"
				style={{
					top: `${COIN_CENTER_Y}%`,
					left: `${COIN_CENTER_X}%`,
					transform: "translate(-50%, -50%)",
				}}
			>
				<span
					className="block text-center font-extrabold leading-none text-white tabular-nums"
					style={{ fontSize: "clamp(1.5rem,7cqi,2.4rem)" }}
				>
					{scoreLabel}
				</span>
			</div>
		</div>
	)
}
