// SpiderChartCard — port từ frontend-v1 SpiderChartCard.tsx + SpiderChart.tsx
// Spec: rounded-2xl bg-muted/50 p-5 shadow-sm
// SVG: viewBox 280x280, CENTER=140, RADIUS=88, LEVELS=5

import { BookOpen, Headphones, Mic, PencilLine } from "lucide-react"
import type { OverviewData } from "#/mocks/overview"
import { cn } from "#/shared/lib/utils"

type Skill = "listening" | "reading" | "writing" | "speaking"

const SKILLS: { key: Skill; label: string; icon: React.ReactNode; colorClass: string }[] = [
	{
		key: "listening",
		label: "Listening",
		icon: <Headphones className="size-4" />,
		colorClass: "text-skill-listening",
	},
	{
		key: "reading",
		label: "Reading",
		icon: <BookOpen className="size-4" />,
		colorClass: "text-skill-reading",
	},
	{
		key: "writing",
		label: "Writing",
		icon: <PencilLine className="size-4" />,
		colorClass: "text-skill-writing",
	},
	{
		key: "speaking",
		label: "Speaking",
		icon: <Mic className="size-4" />,
		colorClass: "text-skill-speaking",
	},
]

interface Props {
	spider: OverviewData["spider"]
}

// ─── SVG Spider Chart ─────────────────────────────────────────────

const SIZE = 280
const CENTER = SIZE / 2
const RADIUS = 88
const LEVELS = 5

function polarToXY(angle: number, radius: number) {
	const rad = ((angle - 90) * Math.PI) / 180
	return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) }
}

function gridPath(skills: { key: Skill }[], level: number): string {
	const r = (RADIUS / LEVELS) * level
	const step = 360 / skills.length
	return (
		skills
			.map((_, i) => {
				const { x, y } = polarToXY(i * step, r)
				return `${i === 0 ? "M" : "L"} ${x} ${y}`
			})
			.join(" ") + " Z"
	)
}

function SpiderChart({ spider }: Props) {
	const count = SKILLS.length
	const step = 360 / count

	const dataPath =
		SKILLS.map((s, i) => {
			const value = spider[s.key].current
			const r = (value / 10) * RADIUS
			const { x, y } = polarToXY(i * step, r)
			return `${i === 0 ? "M" : "L"} ${x} ${y}`
		}).join(" ") + " Z"

	const isAllZero = SKILLS.every((s) => spider[s.key].current === 0)

	return (
		<div className="relative size-64" style={{ overflow: "visible" }}>
			<svg
				viewBox={`0 0 ${SIZE} ${SIZE}`}
				className="h-full w-full overflow-visible"
				aria-label="Biểu đồ kỹ năng"
				role="img"
				style={{ overflow: "visible" }}
			>
				{/* Grid lines */}
				{[1, 2, 3, 4, 5].map((level) => (
					<path
						key={`grid-${level}`}
						d={gridPath(SKILLS, level)}
						fill="none"
						stroke="currentColor"
						className="text-border"
						strokeWidth={level === LEVELS ? 1.5 : 0.8}
					/>
				))}

				{/* Axes */}
				{SKILLS.map((s, i) => {
					const { x, y } = polarToXY(i * step, RADIUS)
					return (
						<line
							key={`axis-${s.key}`}
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

				{/* Data polygon */}
				{!isAllZero && (
					<path
						d={dataPath}
						className="fill-primary/12 stroke-primary"
						strokeWidth={2.5}
						strokeLinejoin="round"
					/>
				)}

				{/* Dots */}
				{!isAllZero &&
					SKILLS.map((s, i) => {
						const value = spider[s.key].current
						const r = (value / 10) * RADIUS
						const { x, y } = polarToXY(i * step, r)
						return (
							<circle
								key={`dot-${s.key}`}
								cx={x}
								cy={y}
								r={4.5}
								className="fill-primary stroke-background"
								strokeWidth={2.5}
							/>
						)
					})}

				{/* Labels */}
				{SKILLS.map((s, i) => {
					const rawY = polarToXY(i * step, RADIUS).y
					const isLR = Math.abs(rawY - CENTER) < 15
					const labelR = isLR ? RADIUS + 46 : RADIUS + 20
					const { x, y } = polarToXY(i * step, labelR)
					const yOff = y - CENTER

					let labelY = y
					let valueY = y + 18
					let baseline: "middle" | "auto" | "hanging" = "hanging"
					let vBaseline: "middle" | "auto" | "hanging" = "hanging"

					if (isLR) {
						labelY = y - 12
						valueY = y + 9
						baseline = "middle"
						vBaseline = "middle"
					} else if (yOff < -15) {
						labelY = y - 17
						valueY = y
						baseline = "auto"
						vBaseline = "auto"
					}

					return (
						<g key={`label-${s.key}`}>
							<text
								x={x}
								y={labelY}
								textAnchor="middle"
								dominantBaseline={baseline}
								fontSize={14}
								fontWeight={600}
								fill="currentColor"
								className={s.colorClass}
							>
								{s.label}
							</text>
							<text
								x={x}
								y={valueY}
								textAnchor="middle"
								dominantBaseline={vBaseline}
								fontSize={13}
								fill="currentColor"
								className="text-muted-foreground"
							>
								{spider[s.key].current}/10
							</text>
						</g>
					)
				})}
			</svg>
		</div>
	)
}

// ─── Card wrapper ─────────────────────────────────────────────────

export function SpiderChartCard({ spider }: Props) {
	const isEstimated = SKILLS.every((s) => spider[s.key].trend === "insufficient_data")

	return (
		<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
			<h3 className="text-lg font-semibold">Điểm trung bình theo kỹ năng</h3>
			<p className="mb-4 text-sm text-muted-foreground">
				{isEstimated ? "Ước lượng từ đánh giá ban đầu" : "trong Test Practice"}
			</p>
			<div className="flex justify-center">
				<SpiderChart spider={spider} />
			</div>
			{/* Legend */}
			<div className="mt-4 grid grid-cols-2 gap-2">
				{SKILLS.map((s) => (
					<div
						key={s.key}
						className="flex items-center gap-2 rounded-lg p-2 text-sm transition-colors hover:bg-muted/50"
					>
						<span className={cn("shrink-0", s.colorClass)}>{s.icon}</span>
						<span>{s.label}</span>
						<span className="ml-auto text-xs tabular-nums text-muted-foreground">
							{spider[s.key].current > 0 ? spider[s.key].current.toFixed(1) : "—"}
						</span>
					</div>
				))}
			</div>
		</div>
	)
}
