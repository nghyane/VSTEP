import { cn } from "#/lib/utils"

type Tone = "primary" | "coin" | "warning" | "info" | "streak"

interface Props {
	/** 0–100. Tự clamp về [0,100]. */
	value: number
	tone?: Tone
	/** Chiều cao px của thanh. Default 12 (~h-3). */
	heightPx?: number
	className?: string
	/** Aria-label cho a11y khi không có context bên ngoài. */
	label?: string
}

const TONE: Record<Tone, { fill: string; highlight: string }> = {
	primary: { fill: "bg-primary", highlight: "bg-primary-light" },
	coin: { fill: "bg-coin", highlight: "bg-coin-light" },
	warning: { fill: "bg-warning", highlight: "bg-warning-light" },
	info: { fill: "bg-info", highlight: "bg-info-light" },
	streak: { fill: "bg-streak", highlight: "bg-streak-light" },
}

/**
 * Thanh tiến độ kiểu Duolingo: track tối + fill sáng + dải highlight nhỏ phía trên.
 * Highlight scale theo fill width nên ở các giá trị nhỏ vẫn nhìn cân.
 *
 * Dùng cho: word count writing, exam progress, daily goal, streak goal, level XP, ...
 *
 * Tokens cần có cho mỗi tone: `--color-{tone}` (fill) + `--color-{tone}-light` (highlight).
 */
export function DuoProgressBar({ value, tone = "primary", heightPx = 12, className, label }: Props) {
	const pct = Math.max(0, Math.min(100, value))
	const t = TONE[tone]

	return (
		<div
			role="progressbar"
			aria-valuenow={Math.round(pct)}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-label={label}
			className={cn("relative w-full overflow-hidden rounded-full bg-border/60", className)}
			style={{ height: heightPx }}
		>
			<div
				className={cn("relative h-full rounded-full transition-[width] duration-300", t.fill)}
				style={{ width: `${pct}%` }}
			>
				{pct > 0 && (
					<span
						aria-hidden
						className={cn("absolute left-1.5 right-1.5 top-1 h-0.5 rounded-full opacity-90", t.highlight)}
					/>
				)}
			</div>
		</div>
	)
}
