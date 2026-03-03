import { cn } from "@/lib/utils"

interface SkillData {
	label: string
	value: number
	color: string
}

interface SpiderChartProps {
	skills: SkillData[]
	className?: string
}

const SIZE = 280
const CENTER = SIZE / 2
const RADIUS = 88
const LEVELS = 5

function polarToXY(angle: number, radius: number) {
	const rad = ((angle - 90) * Math.PI) / 180
	return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) }
}

export function SpiderChart({ skills, className }: SpiderChartProps) {
	const count = skills.length
	const angleStep = 360 / count

	function gridPath(level: number) {
		const r = (RADIUS / LEVELS) * level
		return skills
			.map((_, i) => {
				const { x, y } = polarToXY(i * angleStep, r)
				return `${i === 0 ? "M" : "L"} ${x} ${y}`
			})
			.join(" ")
			.concat(" Z")
	}

	const dataPath = skills
		.map((s, i) => {
			const r = (s.value / 10) * RADIUS
			const { x, y } = polarToXY(i * angleStep, r)
			return `${i === 0 ? "M" : "L"} ${x} ${y}`
		})
		.join(" ")
		.concat(" Z")

	return (
		<div className={cn("relative", className)}>
			<svg
				viewBox={`0 0 ${SIZE} ${SIZE}`}
				className="h-full w-full"
				aria-label="Biểu đồ kỹ năng"
				role="img"
			>
				{/* Grid levels */}
				{[1, 2, 3, 4, 5].map((level) => (
					<path
						key={`grid-${level}`}
						d={gridPath(level)}
						fill="none"
						stroke="currentColor"
						className="text-border"
						strokeWidth={level === LEVELS ? 1.5 : 0.8}
					/>
				))}

				{/* Axis lines */}
				{skills.map((s, i) => {
					const { x, y } = polarToXY(i * angleStep, RADIUS)
					return (
						<line
							key={`axis-${s.label}`}
							x1={CENTER}
							y1={CENTER}
							x2={x}
							y2={y}
							stroke="currentColor"
							className="text-border"
							strokeWidth={0.8}
						/>
					)
				})}

				{/* Data fill */}
				<path
					d={dataPath}
					className="fill-primary/12 stroke-primary"
					strokeWidth={2.5}
					strokeLinejoin="round"
				/>

				{/* Data points */}
				{skills.map((s, i) => {
					const r = (s.value / 10) * RADIUS
					const { x, y } = polarToXY(i * angleStep, r)
					return (
						<circle
							key={`dot-${s.label}`}
							cx={x}
							cy={y}
							r={4.5}
							className="fill-primary stroke-background"
							strokeWidth={2.5}
						/>
					)
				})}
			</svg>

			{/* Labels positioned outside */}
			{skills.map((s, i) => {
				const labelR = RADIUS + 32
				const { x, y } = polarToXY(i * angleStep, labelR)
				const pctLeft = (x / SIZE) * 100
				const pctTop = (y / SIZE) * 100

				return (
					<div
						key={s.label}
						className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
						style={{ left: `${pctLeft}%`, top: `${pctTop}%` }}
					>
						<span className={cn("text-xs font-bold", s.color)}>{s.label}</span>
						<span className="text-[11px] tabular-nums text-muted-foreground">{s.value}/10</span>
					</div>
				)
			})}
		</div>
	)
}
