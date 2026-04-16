// Mascot trâu cầm đồng xu với điểm số overlay.
// Dùng mix-blend-multiply + isolation để loại bỏ nền trắng của ảnh gốc,
// cùng kỹ thuật với FireIcon.tsx (xem FireIcon.tsx để tham khảo).

import { cn } from "#/lib/utils"

const BULL_MASCOT_SRC = "/Gemini_Generated_Image_s3cjsls3cjsls3cj.png"

// Toạ độ tâm đồng xu (% so với kích thước ảnh).
// Điều chỉnh 2 hằng số này nếu vị trí lệch sau khi thay ảnh mới.
const COIN_CENTER_X = 64
const COIN_CENTER_Y = 53

interface BullMascotCoinProps {
	score: number
	sizeClass?: string
	className?: string
}

export function BullMascotCoin({ score, sizeClass = "w-52", className }: BullMascotCoinProps) {
	const scoreLabel = Number.isInteger(score) ? score.toFixed(1) : String(score)

	return (
		<div className={cn("relative inline-block select-none", sizeClass, className)}>
			{/*
			 * mix-blend-multiply trong isolated white container:
			 * pixel trắng × white bg = white → vô hình so với nền trắng của card.
			 */}
			<div className="relative w-full" style={{ isolation: "isolate" }}>
				<img
					src={BULL_MASCOT_SRC}
					alt="Mascot trâu VSTEP"
					className="w-full object-contain mix-blend-multiply dark:mix-blend-screen"
				/>
			</div>

			{/* Screen reader */}
			<span className="sr-only">Điểm số: {scoreLabel}</span>

			{/*
			 * Score overlay: đặt tại tâm đồng xu bằng absolute + translate(-50%, -50%).
			 * Không dùng width/aspect-ratio để tránh lệch khi resize.
			 */}
			<div
				aria-hidden
				className="pointer-events-none absolute"
				style={{
					top: `${COIN_CENTER_Y}%`,
					left: `${COIN_CENTER_X}%`,
					transform: "translate(-50%, -50%)",
				}}
			>
				<span className="block text-center text-[clamp(1.4rem,7cqi,2.2rem)] font-extrabold leading-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
					{scoreLabel}
				</span>
			</div>
		</div>
	)
}
