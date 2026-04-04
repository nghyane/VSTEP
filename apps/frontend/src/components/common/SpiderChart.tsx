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
		<div className={cn("relative", className)} style={{ overflow: "visible" }}>
			<svg
				viewBox={`0 0 ${SIZE} ${SIZE}`}
				className="h-full w-full overflow-visible"
				aria-label="Biểu đồ kỹ năng"
				role="img"
				style={{ overflow: "visible" }}
			>
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

				<path
					d={dataPath}
					className="fill-primary/12 stroke-primary"
					strokeWidth={2.5}
					strokeLinejoin="round"
				/>

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

				{skills.map((s, i) => {
					const rawY = polarToXY(i * angleStep, RADIUS).y
					const isLeftRight = Math.abs(rawY - CENTER) < 15

					const labelR = isLeftRight ? RADIUS + 46 : RADIUS + 20
					const { x, y } = polarToXY(i * angleStep, labelR)
					const yOff = y - CENTER

					const labelX = x
					const valueX = x
					let labelY: number
					let valueY: number
					let labelAnchor: "start" | "end" | "middle"
					let valueAnchor: "start" | "end" | "middle"
					let labelBaseline: "middle" | "auto" | "hanging"
					let valueBaseline: "middle" | "auto" | "hanging"

					if (isLeftRight) {
						labelAnchor = "middle"
						valueAnchor = "middle"
						labelY = y - 12
						valueY = y + 9
						labelBaseline = "middle"
						valueBaseline = "middle"
					} else if (yOff < -15) {
						labelAnchor = "middle"
						valueAnchor = "middle"
						labelY = y - 17
						valueY = y
						labelBaseline = "auto"
						valueBaseline = "auto"
					} else {
						labelAnchor = "middle"
						valueAnchor = "middle"
						labelY = y
						valueY = y + 18
						labelBaseline = "hanging"
						valueBaseline = "hanging"
					}

					return (
						<g key={`label-${s.label}`}>
							<text
								x={labelX}
								y={labelY}
								textAnchor={labelAnchor}
								dominantBaseline={labelBaseline}
								fontSize={14}
								fontWeight={600}
								fill="currentColor"
								className={s.color}
							>
								{s.label}
							</text>
							<text
								x={valueX}
								y={valueY}
								textAnchor={valueAnchor}
								dominantBaseline={valueBaseline}
								fontSize={13}
								fill="currentColor"
								className="text-muted-foreground"
							>
								{s.value}/10
							</text>
						</g>
					)
				})}
			</svg>
		</div>
	)
}
