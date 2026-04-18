// FireIcon — shared component cho 2 GIF ngọn lửa streak (đỏ = active, xanh = inactive).
// Dùng ở StreakButton (header) và ActivityHeatmap (overview).

import { cn } from "#/lib/utils"

const FIRE_ACTIVE_SRC = "/streak-fire-active.gif"
const FIRE_INACTIVE_SRC = "/streak-fire-inactive.gif"

interface Props {
	active: boolean
	sizeClass: string
	className?: string
}

export function FireIcon({ active, sizeClass, className }: Props) {
	return (
		<img
			src={active ? FIRE_ACTIVE_SRC : FIRE_INACTIVE_SRC}
			alt=""
			// mix-blend-mode:multiply làm pixel trắng của GIF "biến mất" trên light bg.
			// Bản chính thức nên là GIF transparent (xóa bg bằng ezgif.com).
			className={cn(
				sizeClass,
				"object-contain mix-blend-multiply dark:mix-blend-screen",
				className,
			)}
		/>
	)
}
