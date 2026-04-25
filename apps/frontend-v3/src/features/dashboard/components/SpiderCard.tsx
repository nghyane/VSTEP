import { useQuery } from "@tanstack/react-query"
import { Icon } from "#/components/Icon"
import { overviewQuery, selectSpider } from "#/features/dashboard/queries"
import { skills } from "#/lib/skills"

const SIZE = 280
const CENTER = SIZE / 2
const RADIUS = 88
const LEVELS = 5

function polarToXY(angleDeg: number, radius: number) {
	const rad = ((angleDeg - 90) * Math.PI) / 180
	return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) }
}

function gridPath(level: number): string {
	const r = (RADIUS / LEVELS) * level
	const step = 360 / skills.length
	return `${skills
		.map((_, i) => {
			const { x, y } = polarToXY(i * step, r)
			return `${i === 0 ? "M" : "L"} ${x} ${y}`
		})
		.join(" ")} Z`
}

function dataPath(values: number[]): string {
	const step = 360 / skills.length
	return `${values
		.map((v, i) => {
			const r = (Math.max(0, Math.min(10, v)) / 10) * RADIUS
			const { x, y } = polarToXY(i * step, r)
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
	const step = 360 / skills.length

	return (
		<div className="card p-6 flex flex-col">
			<div className="flex items-start justify-between gap-3">
				<div>
					<h3 className="font-extrabold text-lg text-foreground">Năng lực 4 kỹ năng</h3>
					<p className="text-sm text-subtle mt-1">
						{hasData
							? `Trung bình từ ${chart?.sample_size ?? 0} bài thi gần nhất`
							: `Cần thêm ${Math.max(0, minTests - totalTests)} bài thi để hiện biểu đồ`}
					</p>
				</div>
				<div className="shrink-0 text-right">
					<span className="flex items-center justify-end gap-1.5 h-7 text-sm font-bold text-foreground">
						<span className="w-3 h-2 rounded-sm bg-primary/30 border border-primary" />
						Hiện tại
					</span>
					<span className="flex items-center justify-end gap-1.5 h-5 mt-1 text-sm text-subtle">
						<span className="w-3 h-0.5 border-t border-dashed border-destructive" />
						Mục tiêu {targetBand.toFixed(1)}
					</span>
				</div>
			</div>

			<div className="flex-1 flex items-center justify-center py-2">
				<svg
					viewBox={`0 0 ${SIZE} ${SIZE}`}
					className="w-full max-w-[320px] overflow-visible"
					role="img"
					aria-label="Spider chart 4 kỹ năng"
				>
					<g fill="none" stroke="var(--color-border)">
						{[1, 2, 3, 4, 5].map((lv) => (
							<path key={lv} d={gridPath(lv)} strokeWidth={lv === LEVELS ? 1.5 : 0.8} />
						))}
					</g>

					<g stroke="var(--color-border)" strokeWidth={0.8}>
						{skills.map((s, i) => {
							const { x, y } = polarToXY(i * step, RADIUS)
							return <line key={`axis-${s.key}`} x1={CENTER} y1={CENTER} x2={x} y2={y} />
						})}
					</g>

					<path
						d={dataPath([targetBand, targetBand, targetBand, targetBand])}
						fill="var(--color-destructive)"
						fillOpacity={0.04}
						stroke="var(--color-destructive)"
						strokeWidth={1.25}
						strokeDasharray="4 3"
						strokeLinejoin="round"
					/>

					{hasData && (
						<path
							d={dataPath(values)}
							fill="var(--color-primary)"
							fillOpacity={0.18}
							stroke="var(--color-primary)"
							strokeWidth={2.5}
							strokeLinejoin="round"
						/>
					)}

					{hasData &&
						skills.map((s, i) => {
							const v = values[i] ?? 0
							const r = (v / 10) * RADIUS
							const { x, y } = polarToXY(i * step, r)
							return (
								<circle
									key={`dot-${s.key}`}
									cx={x}
									cy={y}
									r={4.5}
									fill="var(--color-primary)"
									stroke="white"
									strokeWidth={2.5}
								/>
							)
						})}

					{skills.map((s, i) => {
						const labelR = i === 0 || i === 2 ? RADIUS + 22 : RADIUS + 36
						const { x, y } = polarToXY(i * step, labelR)
						const v = values[i] ?? 0
						return (
							<g key={`label-${s.key}`}>
								<text x={x} y={y - 6} textAnchor="middle" fontSize={12} fontWeight={700} fill={s.color}>
									{s.label}
								</text>
								<text x={x} y={y + 9} textAnchor="middle" fontSize={11} fill="var(--color-subtle)">
									{v > 0 ? `${v.toFixed(1)}/10` : "—"}
								</text>
							</g>
						)
					})}
				</svg>
			</div>

			<div className="mt-3 grid grid-cols-2 gap-2">
				{skills.map((s, i) => {
					const v = values[i] ?? 0
					return (
						<div key={s.key} className="flex items-center gap-2 rounded-(--radius-button) p-2 text-sm">
							<span
								className="inline-flex size-6 items-center justify-center rounded-md"
								style={{ background: `color-mix(in srgb, ${s.color} 15%, transparent)`, color: s.color }}
							>
								<Icon name={s.icon} size="xs" />
							</span>
							<span className="font-bold text-foreground">{s.label}</span>
							<span className="ml-auto text-xs tabular-nums font-bold" style={{ color: s.color }}>
								{v > 0 ? v.toFixed(1) : "—"}
							</span>
						</div>
					)
				})}
			</div>
		</div>
	)
}
