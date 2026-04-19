const SKILLS = [
	{ key: "listening", label: "Nghe", current: 5.5, color: "#1CB0F6" },
	{ key: "reading", label: "Đọc", current: 6.0, color: "#7850C8" },
	{ key: "writing", label: "Viết", current: 4.5, color: "#58CC02" },
	{ key: "speaking", label: "Nói", current: 0, color: "#DCAA00" },
] as const

const TARGET = 6.0
const R = 88
const CX = 140
const CY = 140

function toXY(index: number, value: number) {
	// 4 axes: top, right, bottom, left
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
	return values
		.map((v, i) => {
			const { x, y } = toXY(i, v)
			return `${x},${y}`
		})
		.join(" ")
}

export function SpiderCard() {
	const targetPoly = polygon([TARGET, TARGET, TARGET, TARGET])
	const currentPoly = polygon(SKILLS.map((s) => s.current))

	return (
		<div className="card p-6">
			<h3 className="font-extrabold text-lg text-foreground">Năng lực 4 kỹ năng</h3>
			<p className="text-sm text-subtle mt-1">Trung bình từ 3 bài thi thử gần nhất</p>

			<div className="flex items-center justify-center py-4">
				<svg
					viewBox="0 0 280 280"
					role="img"
					aria-label="Spider chart"
					className="w-full max-w-[320px] overflow-visible"
				>
					{/* Grid */}
					<g fill="none" stroke="var(--color-border)" strokeWidth="1">
						{[1, 2, 3, 4, 5].map((lv) => (
							<polygon key={lv} points={polygon([lv * 2, lv * 2, lv * 2, lv * 2])} />
						))}
					</g>
					{/* Axes */}
					<g stroke="var(--color-border)" strokeWidth="1">
						<line x1={CX} y1={CY} x2={CX} y2={CY - R} />
						<line x1={CX} y1={CY} x2={CX + R} y2={CY} />
						<line x1={CX} y1={CY} x2={CX} y2={CY + R} />
						<line x1={CX} y1={CY} x2={CX - R} y2={CY} />
					</g>
					{/* Target */}
					<polygon
						points={targetPoly}
						fill="var(--color-destructive)"
						fillOpacity={0.05}
						stroke="var(--color-destructive)"
						strokeWidth={1.5}
						strokeDasharray="4 3"
						strokeLinejoin="round"
					/>
					{/* Current */}
					<polygon
						points={currentPoly}
						fill="var(--color-primary)"
						fillOpacity={0.15}
						stroke="var(--color-primary)"
						strokeWidth={2.5}
						strokeLinejoin="round"
					/>
					{/* Dots */}
					{SKILLS.map((s, i) => {
						const { x, y } = toXY(i, s.current)
						return (
							<circle
								key={s.key}
								cx={x}
								cy={y}
								r={5}
								fill={s.current > 0 ? s.color : "var(--color-placeholder)"}
								stroke="white"
								strokeWidth={2.5}
							/>
						)
					})}
					{/* Labels */}
					{SKILLS.map((s, i) => {
						const positions = [
							{ x: CX, y: 44, anchor: "middle" as const },
							{ x: 244, y: CY + 4, anchor: "start" as const },
							{ x: CX, y: 256, anchor: "middle" as const },
							{ x: 36, y: CY + 4, anchor: "end" as const },
						]
						const pos = positions[i] ?? positions[0]
						return (
							<text
								key={s.key}
								x={pos.x}
								y={pos.y}
								textAnchor={pos.anchor}
								fontSize={13}
								fontWeight={700}
								fill={s.color}
							>
								{s.label}
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
