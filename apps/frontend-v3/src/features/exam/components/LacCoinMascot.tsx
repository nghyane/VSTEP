// Mascot Lạc cầm đồng xu với score thang 10 overlay.
// Ảnh gốc đã được xử lý remove background (lac-coin-nobg.png).

import { cn } from "#/lib/utils"

// Tọa độ tâm đồng xu (% so với kích thước ảnh gốc 1413×1113).
const COIN_CENTER_X = 67
const COIN_CENTER_Y = 55

interface Props {
	scoreLabel: string
	className?: string
}

export function LacCoinMascot({ scoreLabel, className }: Props) {
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

			<span className="sr-only">Điểm: {scoreLabel}/10</span>

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
					className="block text-center font-extrabold leading-none text-white"
					style={{ fontSize: "clamp(1.5rem,7cqi,2.4rem)" }}
				>
					{scoreLabel}
				</span>
			</div>
		</div>
	)
}
