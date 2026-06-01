interface LogoProps {
	className?: string
	size?: "sm" | "default" | "lg"
}

import { cn } from "@/lib/utils"

const heights = {
	sm: 20,
	default: 28,
	lg: 42,
}

export function Logo({ className, size = "default" }: LogoProps) {
	const h = heights[size]
	const w = Math.round(h * (120 / 32))

	return (
		<svg
			width={w}
			height={h}
			viewBox="0 0 120 32"
			fill="none"
			stroke="currentColor"
			strokeWidth="4"
			strokeLinecap="round"
			strokeLinejoin="round"
			xmlns="http://www.w3.org/2000/svg"
			aria-label="VSTEP"
			className={cn("text-primary", className)}
		>
			{/* V — ascending progress mark */}
			<path d="M 12 9 L 22 24 L 26 18 M 30 12 L 34 6" />
			{/* S */}
			<path d="M 57 12 A 4 4 0 0 0 53 8 L 50 8 A 4 4 0 0 0 46 12 A 4 4 0 0 0 50 16 L 53 16 A 4 4 0 0 1 57 20 A 4 4 0 0 1 53 24 L 50 24 A 4 4 0 0 1 46 20" />
			{/* T */}
			<path d="M 63 8 L 75 8 M 69 8 L 69 24" />
			{/* E */}
			<path d="M 92 8 L 81 8 L 81 24 L 92 24 M 81 16 L 90 16" />
			{/* P */}
			<path d="M 98 24 L 98 8 L 105 8 A 4 4 0 0 1 109 12 A 4 4 0 0 1 105 16 L 98 16" />
		</svg>
	)
}
