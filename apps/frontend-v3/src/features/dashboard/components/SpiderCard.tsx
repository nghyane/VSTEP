import type { OverviewChart } from "#/features/dashboard/queries"
import { SKILL_CONFIG, type SkillKey } from "#/lib/skills"

const SKILL_KEYS: SkillKey[] = ["listening", "reading", "writing", "speaking"]
const TARGET = 6.0
const R = 88
const CX = 140
const CY = 140

function toXY(index: number, value: number) {
	const dirs = [
		{ dx: 0, dy: -1 },
		{ dx: 1, dy: 0 },
		{ dx: 0, dy: 1 },
		{ dx: -1, dy: 0 },
	]
	const d = dirs[index] ?? dirs[0]
	const r = (value / 10) * R
	return { x: CX + d.dx * r, y: CY + d.dy * r }
}

function polygon(values: number[]) {
	return values.map((v, i) => `${toXY(i, v).x},${toXY(i, v).y}`).join(" ")
}

interface Props {
	chart: OverviewChart | null
	minTests: number
	totalTests: number
}

export function SpiderCard({ chart, minTests, totalTests }: Props) {
	const values = SKILL_KEYS.map((k) => chart?.[k] ?? 0)
	const hasData = chart !== null
	const targetPoly = polygon([TARGET, TARGET, TARGET, TARGET])
	const currentPoly = polygon(values)

	return (
		<div className="card p-6">
			<h3 className="font-extrabold text-lg text-foreground">Năng lực 4 kỹ năng</h3>
			<p className="text-sm text-subtle mt-1">
				{hasData
					? `Trung bình từ ${chart.sample_size} bài thi thử gần nhất`
					: `Cần thêm ${minTests - totalTests} bài thi để hiện biểu đồ`}
			</p>

			<div className="flex items-center justify-center py-4">
				<svg
					viewBox="0 0 280 280"
					className="w-full max-w-[320px] overflow-visible"
					role="img"
					aria-label="Spider chart"
				>
					<g fill="none" stroke="var(--color-border)" strokeWidth="1">
						{[1, 2, 3, 4, 5].map((lv) => (
							<polygon key={lv} points={polygon([lv * 2, lv * 2, lv * 2, lv * 2])} />
						))}
					</g>
					<g stroke="var(--color-border)" strokeWidth="1">
						<line x1={CX} y1={CY} x2={CX} y2={CY - R} />
						<line x1={CX} y1={CY} x2={CX + R} y2={CY} />
						<line x1={CX} y1={CY} x2={CX} y2={CY + R} />
						<line x1={CX} y1={CY} x2={CX - R} y2={CY} />
					</g>
					<polygon
						points={targetPoly}
						fill="var(--color-destructive)"
						fillOpacity={0.05}
						stroke="var(--color-destructive)"
						strokeWidth={1.5}
						strokeDasharray="4 3"
						strokeLinejoin="round"
					/>
					{hasData && (
						<polygon
							points={currentPoly}
							fill="var(--color-primary)"
							fillOpacity={0.15}
							stroke="var(--color-primary)"
							strokeWidth={2.5}
							strokeLinejoin="round"
						/>
					)}
					{SKILL_KEYS.map((k, i) => {
						const v = values[i]
						const { x, y } = toXY(i, v)
						return (
							<circle
								key={k}
								cx={x}
								cy={y}
								r={5}
								fill={v > 0 ? SKILL_CONFIG[k].color : "var(--color-placeholder)"}
								stroke="white"
								strokeWidth={2.5}
							/>
						)
					})}
					{SKILL_KEYS.map((k, i) => {
						const positions = [
							{ x: CX, y: 44, anchor: "middle" as const },
							{ x: 244, y: CY + 4, anchor: "start" as const },
							{ x: CX, y: 256, anchor: "middle" as const },
							{ x: 36, y: CY + 4, anchor: "end" as const },
						]
						const pos = positions[i] ?? positions[0]
						return (
							<text
								key={k}
								x={pos.x}
								y={pos.y}
								textAnchor={pos.anchor}
								fontSize={13}
								fontWeight={700}
								fill={SKILL_CONFIG[k].color}
							>
								{SKILL_CONFIG[k].label}
							</text>
						)
					})}
				</svg>
			</div>

			<div className="flex items-center justify-center gap-5 text-xs text-subtle">
				<div className="flex items-center gap-1.5">
					<span className="w-3 h-2 rounded-sm bg-primary/30 border border-primary" />
					Hiện tại
				</div>
				<div className="flex items-center gap-1.5">
					<span className="w-3 h-0.5 border-t border-dashed border-destructive" />
					Mục tiêu B2
				</div>
			</div>
		</div>
	)
}
