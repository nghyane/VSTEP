import { cn } from "#/lib/utils"

const SIZES = {
	xs: "h-4 w-auto",
	sm: "h-6 w-auto",
	md: "h-8 w-auto",
	lg: "h-10 w-auto",
	xl: "h-12 w-auto",
} as const

type Size = keyof typeof SIZES

interface Props {
	size?: Size
	className?: string
	/** Khi true thì icon idle-cháy chậm liên tục (streak > 0). */
	burning?: boolean
	/** Click burst: tăng key để replay nhịp cháy mạnh hơn. */
	burnKey?: number
}

/**
 * Inline SVG version của icon streak để có thể animate riêng từng path:
 *  - shell (ngọn lửa cam ngoài) pulse nhẹ.
 *  - core (lõi vàng) flicker scale-Y/X ngược pha, mô phỏng ngọn lửa cháy.
 *
 * 3 trạng thái:
 *  1. burnKey>0: burst nhanh 2-3 nhịp (click feedback). Override mọi animation khác.
 *  2. burning=true (streak>0): idle cháy chậm vĩnh viễn.
 *  3. mặc định: tĩnh, chỉ cháy khi hover (group-hover từ button cha).
 */
export function StreakIcon({ size = "sm", className, burning, burnKey = 0 }: Props) {
	const bursting = burnKey > 0

	let shellAnim: string
	let coreAnim: string
	if (bursting) {
		shellAnim = "animate-[flameOuterPulse_550ms_ease-in-out_2]"
		coreAnim = "animate-[flameInnerFlicker_420ms_ease-in-out_3]"
	} else if (burning) {
		shellAnim = "animate-[flameOuterPulse_1800ms_ease-in-out_infinite]"
		coreAnim = "animate-[flameInnerFlicker_1100ms_ease-in-out_infinite]"
	} else {
		shellAnim = "group-hover:animate-[flameOuterPulse_1100ms_ease-in-out_infinite]"
		coreAnim = "group-hover:animate-[flameInnerFlicker_700ms_ease-in-out_infinite]"
	}

	return (
		<svg
			viewBox="0 0 19 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={cn(SIZES[size], "overflow-visible", className)}
			role="presentation"
			aria-hidden
		>
			<path
				d="M0 15.0451V5.54508C0 3.5451 1.5 3.54507 2.5 4.04507L4.5 5.04507C5.33333 3.87841 7.2 1.34508 8 0.545085C9 -0.454915 10 0.045085 11 1.04508C12 2.04508 15 6.04508 16.5 8.04508C18 10.0451 18.5 12.0451 18.5 15.0451C18.5 18.0451 15 23.0451 9 23.0451C3 23.0451 0 17.5451 0 15.0451Z"
				fill="#FF9600"
				className={cn("origin-bottom", shellAnim)}
				style={{ transformBox: "fill-box" }}
			/>
			<path
				key={`core-${burnKey}`}
				d="M5.99996 13.5451C6.79996 12.3451 7.99996 10.7118 8.49996 10.0451C8.66664 9.71175 9.2 9.24508 10 10.0451C11 11.0451 12 13.0451 12.5 13.5451C13 14.0451 13.5 16.0451 12.5 17.5451C11.5 19.0451 10 19.5451 9 19.5451C8 19.5451 6.49996 18.5451 5.99996 17.5451C5.49996 16.5451 4.99996 15.0451 5.99996 13.5451Z"
				fill="#FFC800"
				className={cn("origin-bottom", coreAnim)}
				style={{ transformBox: "fill-box" }}
			/>
		</svg>
	)
}
