import { useQuery } from "@tanstack/react-query"
import { SkillIcon } from "#/components/SkillIcon"
import { overviewQuery, selectSpider } from "#/features/dashboard/queries"
import type { Skill } from "#/lib/skills"
import { skills } from "#/lib/skills"

const SIZE = 280
const CENTER = SIZE / 2
const RADIUS = 88
const LEVELS = 5
const STEP = 360 / skills.length

function polarToXY(angle: number, radius: number) {
	const rad = ((angle - 90) * Math.PI) / 180
	return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) }
}

function gridPath(level: number): string {
	const r = (RADIUS / LEVELS) * level
	return `${skills
		.map((_, i) => {
			const { x, y } = polarToXY(i * STEP, r)
			return `${i === 0 ? "M" : "L"} ${x} ${y}`
		})
		.join(" ")} Z`
}

function dataPath(values: number[]): string {
	return `${values
		.map((v, i) => {
			const r = (Math.max(0, Math.min(10, v)) / 10) * RADIUS
			const { x, y } = polarToXY(i * STEP, r)
			return `${i === 0 ? "M" : "L"} ${x} ${y}`
		})
		.join(" ")} Z`
}

export function SpiderCard() {
	const { data } = useQuery({ ...overviewQuery, select: selectSpider })
	if (!data) return null

	const { chart, targetBand, minTests, totalTests } = data
	const values = skills.map((s) => chart?.[s.key] ?? 0)
	const hasData = chart !== null && values.some((v) => v > 0)
	const subtitle = hasData
		? `Trung bình từ ${chart.sample_size} bài thi gần nhất`
		: `Cần thêm ${Math.max(0, minTests - totalTests)} bài thi để hiện biểu đồ`

	return (
		<div className="card p-6">
			<h3 className="font-extrabold text-lg text-foreground">Năng lực 4 kỹ năng</h3>
			<p className="text-sm text-subtle mt-1">{subtitle}</p>

			<div className="flex justify-center mt-4">
				<SpiderChart values={values} targetBand={targetBand} hasData={hasData} />
			</div>

			<SpiderLegend values={values} />
		</div>
	)
}

interface SpiderChartProps {
	values: number[]
	targetBand: number
	hasData: boolean
}

function SpiderChart({ values, targetBand, hasData }: SpiderChartProps) {
	return (
		<svg
			viewBox={`0 0 ${SIZE} ${SIZE}`}
			className="size-64 overflow-visible"
			role="img"
			aria-label="Biểu đồ radar 4 kỹ năng"
		>
			<SpiderGrid />
			<path
				d={dataPath([targetBand, targetBand, targetBand, targetBand])}
				fill="none"
				stroke="var(--color-destructive)"
				strokeWidth={1.5}
				strokeDasharray="5 4"
				opacity={0.7}
			/>
			{hasData && <SpiderData values={values} />}
			{skills.map((s, i) => (
				<SpiderAxisLabel key={`label-${s.key}`} index={i} skill={s} value={values[i] ?? 0} />
			))}
		</svg>
	)
}

function SpiderGrid() {
	return (
		<g>
			{[1, 2, 3, 4, 5].map((level) => (
				<path
					key={`grid-${level}`}
					d={gridPath(level)}
					fill="none"
					stroke="var(--color-border-light)"
					strokeWidth={level === LEVELS ? 1.5 : 0.8}
				/>
			))}
			{skills.map((s, i) => {
				const { x, y } = polarToXY(i * STEP, RADIUS)
				return (
					<line
						key={`axis-${s.key}`}
						x1={CENTER}
						y1={CENTER}
						x2={x}
						y2={y}
						stroke="var(--color-border-light)"
						strokeWidth={0.8}
					/>
				)
			})}
		</g>
	)
}

function SpiderData({ values }: { values: number[] }) {
	return (
		<g>
			<path
				d={dataPath(values)}
				fill="var(--color-primary)"
				fillOpacity={0.15}
				stroke="var(--color-primary)"
				strokeWidth={2.5}
				strokeLinejoin="round"
			/>
			{skills.map((s, i) => {
				const v = values[i] ?? 0
				if (v <= 0) return null
				const r = (v / 10) * RADIUS
				const { x, y } = polarToXY(i * STEP, r)
				return (
					<circle
						key={`dot-${s.key}`}
						cx={x}
						cy={y}
						r={4.5}
						fill={s.color}
						stroke="var(--color-surface)"
						strokeWidth={2.5}
					/>
				)
			})}
		</g>
	)
}

interface SpiderAxisLabelProps {
	index: number
	skill: Skill
	value: number
}

type SvgBaseline = "middle" | "auto" | "hanging"

interface AxisLabelLayout {
	x: number
	labelY: number
	valueY: number
	baseline: SvgBaseline
	vBaseline: SvgBaseline
}

function computeAxisLabelLayout(index: number): AxisLabelLayout {
	const rawY = polarToXY(index * STEP, RADIUS).y
	const isLR = Math.abs(rawY - CENTER) < 15
	const labelR = isLR ? RADIUS + 46 : RADIUS + 20
	const { x, y } = polarToXY(index * STEP, labelR)
	const yOff = y - CENTER

	if (isLR) {
		return { x, labelY: y - 12, valueY: y + 9, baseline: "middle", vBaseline: "middle" }
	}
	if (yOff < -15) {
		return { x, labelY: y - 17, valueY: y, baseline: "auto", vBaseline: "auto" }
	}
	return { x, labelY: y, valueY: y + 18, baseline: "hanging", vBaseline: "hanging" }
}

function SpiderAxisLabel({ index, skill, value }: SpiderAxisLabelProps) {
	const { x, labelY, valueY, baseline, vBaseline } = computeAxisLabelLayout(index)

	return (
		<g>
			<text
				x={x}
				y={labelY}
				textAnchor="middle"
				dominantBaseline={baseline}
				fontSize={13}
				fontWeight={700}
				fill={skill.color}
			>
				{skill.label}
			</text>
			<text
				x={x}
				y={valueY}
				textAnchor="middle"
				dominantBaseline={vBaseline}
				fontSize={12}
				fontWeight={600}
				fill="var(--color-subtle)"
				className="tabular-nums"
			>
				{value > 0 ? `${value.toFixed(1)}/10` : "—"}
			</text>
		</g>
	)
}

function SpiderLegend({ values }: { values: number[] }) {
	return (
		<div className="mt-4 grid grid-cols-2 gap-2">
			{skills.map((s, i) => {
				const v = values[i] ?? 0
				return (
					<div key={s.key} className="flex items-center gap-2 rounded-(--radius-button) p-2 text-sm">
						<SkillIcon name={s.pngIcon} size="xs" />
						<span className="font-bold text-foreground">{s.label}</span>
						<span
							className="ml-auto text-base font-extrabold tabular-nums"
							style={{ color: v > 0 ? s.color : "var(--color-subtle)" }}
						>
							{v > 0 ? v.toFixed(1) : "—"}
						</span>
					</div>
				)
			})}
		</div>
	)
}
