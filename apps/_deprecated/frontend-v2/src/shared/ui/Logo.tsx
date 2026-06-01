import { cn } from "#/shared/lib/utils"

interface LogoProps {
	className?: string
	size?: "sm" | "default" | "lg"
	variant?: "full" | "mark"
}

const heights = { sm: 20, default: 28, lg: 42 }

// Mark (chữ V) dùng cùng viewBox ở cả 2 variant để scale pixel identical.
const MARK_VIEW_BOX = "8 2 30 28"
const MARK_RATIO = 30 / 28

// STEP viewBox bao S (x=46) → P (x=109), y 2..30.
const STEP_VIEW_BOX = "44 2 67 28"
const STEP_RATIO = 67 / 28

const svgBaseProps = {
	fill: "none",
	stroke: "currentColor",
	strokeWidth: "4",
	strokeLinecap: "round",
	strokeLinejoin: "round",
	xmlns: "http://www.w3.org/2000/svg",
} as const

export function Logo({ className, size = "default", variant = "full" }: LogoProps) {
	const h = heights[size]
	const markW = Math.round(h * MARK_RATIO)
	const stepW = Math.round(h * STEP_RATIO)

	return (
		<span
			role="img"
			aria-label="VSTEP"
			className={cn("inline-flex items-center gap-1.5 text-primary", className)}
		>
			{/* V mark — identical ở cả 2 variant */}
			<svg
				width={markW}
				height={h}
				viewBox={MARK_VIEW_BOX}
				{...svgBaseProps}
				aria-hidden="true"
				focusable="false"
			>
				<title>V</title>
				<path d="M 12 9 L 22 24 L 26 18 M 30 12 L 34 6" />
			</svg>

			{/* STEP — chỉ render khi sidebar mở */}
			{variant === "full" && (
				<svg
					width={stepW}
					height={h}
					viewBox={STEP_VIEW_BOX}
					{...svgBaseProps}
					aria-hidden="true"
					focusable="false"
				>
					<title>STEP</title>
					{/* S */}
					<path d="M 57 12 A 4 4 0 0 0 53 8 L 50 8 A 4 4 0 0 0 46 12 A 4 4 0 0 0 50 16 L 53 16 A 4 4 0 0 1 57 20 A 4 4 0 0 1 53 24 L 50 24 A 4 4 0 0 1 46 20" />
					{/* T */}
					<path d="M 63 8 L 75 8 M 69 8 L 69 24" />
					{/* E */}
					<path d="M 92 8 L 81 8 L 81 24 L 92 24 M 81 16 L 90 16" />
					{/* P */}
					<path d="M 98 24 L 98 8 L 105 8 A 4 4 0 0 1 109 12 A 4 4 0 0 1 105 16 L 98 16" />
				</svg>
			)}
		</span>
	)
}
