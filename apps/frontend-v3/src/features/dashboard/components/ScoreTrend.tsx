import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { SkillIcon } from "#/components/SkillIcon"
import { overviewQuery, selectTargetBand } from "#/features/dashboard/queries"
import type { ScoreTimelinePoint } from "#/features/dashboard/types"
import { skills } from "#/lib/skills"
import { formatShortDate, round } from "#/lib/utils"

const Y_MAX = 180
const Y_MIN = 20
const bandToY = (v: number) => Y_MAX - (v / 10) * (Y_MAX - Y_MIN)

function computeAvg(point: ScoreTimelinePoint): number {
	const vals = skills.map((s) => point[s.key]).filter((v): v is number => v !== null)
	return vals.length > 0 ? round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
}

export function ScoreTrend() {
	const { data: overview, isLoading } = useQuery(overviewQuery)
	const { data: targetBand } = useQuery({ ...overviewQuery, select: selectTargetBand })
	const [activeIdx, setActiveIdx] = useState<number | null>(null)

	if (isLoading || !overview || targetBand === undefined) return null

	const target = targetBand
	const timeline = overview.data.scores.timeline

	if (timeline.length === 0) {
		return (
			<section className="card p-6">
				<h3 className="font-extrabold text-lg text-foreground">Điểm qua các lần thi</h3>
				<p className="text-sm text-subtle mt-1">Chưa có bài thi thử nào</p>
			</section>
		)
	}

	const tests = timeline.slice(-10)
	const spacing = Math.min(98, 500 / tests.length)
	const startX = 78
	const centers = tests.map((_, i) => startX + i * spacing)

	return (
		<section className="card p-6">
			<h3 className="font-extrabold text-lg text-foreground">Điểm qua các lần thi</h3>
			<p className="text-sm text-subtle mt-1">{tests.length} bài thi gần nhất</p>

			<div className="flex flex-wrap gap-2 mt-3 mb-4">
				{skills.map((s) => (
					<span
						key={s.key}
						className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
						style={{ color: s.color }}
					>
						<SkillIcon name={s.pngIcon} size="sm" />
						{s.label}
					</span>
				))}
				<span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-dark">
					<span className="w-4 h-0.5 bg-primary-dark rounded" />
					Trung bình
				</span>
				<span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-destructive">
					<span className="w-4 h-0.5 border-t-2 border-dashed border-destructive" />
					Mục tiêu
				</span>
			</div>

			<svg viewBox="0 0 600 220" role="img" aria-label="Score trend chart" className="w-full">
				<g fontSize="10" fill="var(--color-placeholder)">
					{[0, 2.5, 5, 7.5, 10].map((v) => (
						<g key={v}>
							<line
								x1="36"
								y1={bandToY(v)}
								x2="590"
								y2={bandToY(v)}
								stroke={v === 0 ? "var(--color-border)" : "var(--color-background)"}
								strokeWidth="1"
							/>
							<text x="30" y={bandToY(v) + 4} textAnchor="end">
								{v}
							</text>
						</g>
					))}
				</g>

				{tests.map((test, ti) => {
					const cx = centers[ti] ?? 0
					const isActive = activeIdx === ti
					return (
						<g key={`${test.date}-${ti}`}>
							{skills.map((s, si) => {
								const v = test[s.key] ?? 0
								return (
									<rect
										key={s.key}
										x={cx - 30 + si * 16}
										y={bandToY(v)}
										width={14}
										height={Math.max(0, Y_MAX - bandToY(v))}
										fill={s.color}
										rx={3}
										opacity={isActive ? 0.95 : 0.65}
									/>
								)
							})}
							<text x={cx} y={210} textAnchor="middle" fontSize="10" fill="var(--color-subtle)">
								{formatShortDate(test.date)}
							</text>
							{/* Hover hit-area: full chart-height column. Pointer-events visible only on this rect. */}
							<rect
								x={cx - 32}
								y={Y_MIN}
								width={64}
								height={Y_MAX - Y_MIN}
								fill="transparent"
								onMouseEnter={() => setActiveIdx(ti)}
								onMouseLeave={() => setActiveIdx(null)}
							/>
						</g>
					)
				})}

				<line
					x1="36"
					y1={bandToY(target)}
					x2="590"
					y2={bandToY(target)}
					stroke="var(--color-destructive)"
					strokeWidth={1.5}
					strokeDasharray="4 4"
				/>
				<text
					x="590"
					y={bandToY(target) - 4}
					textAnchor="end"
					fontSize="10"
					fontWeight="700"
					fill="var(--color-destructive)"
				>
					{overview.data.profile.target_level} = {target}
				</text>

				<polyline
					points={tests.map((t, i) => `${centers[i]},${bandToY(computeAvg(t))}`).join(" ")}
					fill="none"
					stroke="var(--color-primary-dark)"
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				{tests.map((t, i) => {
					const avg = computeAvg(t)
					return (
						<g key={`avg-${t.date}-${i}`}>
							<circle
								cx={centers[i]}
								cy={bandToY(avg)}
								r={4}
								fill="white"
								stroke="var(--color-primary-dark)"
								strokeWidth={2}
							/>
							<text
								x={centers[i]}
								y={bandToY(avg) + 16}
								textAnchor="middle"
								fontSize="10"
								fontWeight="700"
								fill="var(--color-muted)"
							>
								{avg}
							</text>
						</g>
					)
				})}

				{activeIdx !== null && tests[activeIdx] && (
					<ScoreTooltip test={tests[activeIdx]} cx={centers[activeIdx] ?? 0} />
				)}
			</svg>
		</section>
	)
}

interface ScoreTooltipProps {
	test: ScoreTimelinePoint
	cx: number
}

function ScoreTooltip({ test, cx }: ScoreTooltipProps) {
	const TOOLTIP_W = 96
	const TOOLTIP_H = 78
	const PAD = 5
	const ROW_H = 9
	const FS = 7
	const placeRight = cx < 300
	const x = placeRight ? cx + 28 : cx - 28 - TOOLTIP_W
	const y = 28
	const avg = computeAvg(test)
	const headerY = y + 11
	const firstRowY = y + 24
	const dividerY = y + TOOLTIP_H - 14
	const footerY = y + TOOLTIP_H - 5

	return (
		<g pointerEvents="none">
			<rect
				x={x}
				y={y}
				width={TOOLTIP_W}
				height={TOOLTIP_H}
				rx={6}
				fill="var(--color-card)"
				stroke="var(--color-border)"
				strokeWidth={1}
			/>
			<text x={x + PAD} y={headerY} fontSize={FS} fontWeight="800" fill="var(--color-foreground)">
				{formatShortDate(test.date)}
			</text>
			{skills.map((s, idx) => {
				const v = test[s.key]
				const rowY = firstRowY + idx * ROW_H
				return (
					<g key={s.key}>
						<circle cx={x + PAD + 2} cy={rowY - 2} r={2} fill={s.color} />
						<text x={x + PAD + 9} y={rowY} fontSize={FS} fill="var(--color-muted)">
							{s.label}
						</text>
						<text
							x={x + TOOLTIP_W - PAD}
							y={rowY}
							textAnchor="end"
							fontSize={FS}
							fontWeight="800"
							fill="var(--color-foreground)"
						>
							{v === null || v === undefined ? "—" : round(v)}
						</text>
					</g>
				)
			})}
			<line
				x1={x + PAD}
				y1={dividerY}
				x2={x + TOOLTIP_W - PAD}
				y2={dividerY}
				stroke="var(--color-border)"
				strokeWidth={0.75}
			/>
			<text x={x + PAD} y={footerY} fontSize={FS} fontWeight="800" fill="var(--color-primary-dark)">
				Trung bình
			</text>
			<text
				x={x + TOOLTIP_W - PAD}
				y={footerY}
				textAnchor="end"
				fontSize={FS}
				fontWeight="800"
				fill="var(--color-primary-dark)"
			>
				{avg}
			</text>
		</g>
	)
}
