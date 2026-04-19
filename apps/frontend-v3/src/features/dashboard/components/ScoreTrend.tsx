const TESTS = [
	{ date: "01/03", L: 5, R: 6, W: 4, S: 0, avg: 3.75 },
	{ date: "10/03", L: 5.5, R: 6, W: 4.5, S: 0, avg: 4.0 },
	{ date: "18/03", L: 6, R: 6.5, W: 5, S: 5, avg: 5.6 },
	{ date: "28/03", L: 6, R: 7, W: 5.5, S: 5.5, avg: 6.0 },
	{ date: "05/04", L: 6.5, R: 7, W: 6, S: 6, avg: 6.4 },
]

const SKILLS = [
	{
		key: "L" as const,
		label: "Nghe",
		color: "#1CB0F6",
		bg: "bg-skill-listening/10",
		text: "text-skill-listening",
	},
	{
		key: "R" as const,
		label: "Đọc",
		color: "#7850C8",
		bg: "bg-skill-reading/10",
		text: "text-skill-reading",
	},
	{
		key: "W" as const,
		label: "Viết",
		color: "#58CC02",
		bg: "bg-skill-writing/10",
		text: "text-skill-writing",
	},
	{ key: "S" as const, label: "Nói", color: "#FFC800", bg: "bg-coin-tint", text: "text-coin-dark" },
]

const TARGET = 6.0
const Y_MAX = 180
const Y_MIN = 20
const bandToY = (v: number) => Y_MAX - (v / 10) * (Y_MAX - Y_MIN)

export function ScoreTrend() {
	const spacing = 98
	const startX = 78
	const centers = TESTS.map((_, i) => startX + i * spacing)

	return (
		<section className="card p-6">
			<h3 className="font-extrabold text-lg text-foreground">Điểm qua các lần thi</h3>
			<p className="text-sm text-subtle mt-1">5 bài thi gần nhất · bấm để ẩn/hiện kỹ năng</p>

			<div className="flex flex-wrap gap-2 mt-3 mb-4">
				{SKILLS.map((s) => (
					<button
						type="button"
						key={s.key}
						className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${s.bg} ${s.text} text-xs font-bold`}
					>
						<span className={`w-2 h-2 rounded-full`} style={{ background: s.color }} />
						{s.label}
					</button>
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
				{/* Y grid */}
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

				{/* Bars per test */}
				{TESTS.map((t, ti) => {
					const cx = centers[ti] ?? 0
					const barW = 14
					const vals = [t.L, t.R, t.W, t.S]
					return (
						<g key={t.date}>
							{vals.map((v, si) => (
								<rect
									key={SKILLS[si]?.key}
									x={cx - 30 + si * 16}
									y={bandToY(v)}
									width={barW}
									height={Math.max(0, Y_MAX - bandToY(v))}
									fill={SKILLS[si]?.color}
									rx={3}
									opacity={0.65}
								/>
							))}
							<text x={cx} y={198} textAnchor="middle" fontSize="10" fill="var(--color-subtle)">
								{t.date}
							</text>
						</g>
					)
				})}

				{/* Target line */}
				<line
					x1="36"
					y1={bandToY(TARGET)}
					x2="590"
					y2={bandToY(TARGET)}
					stroke="var(--color-destructive)"
					strokeWidth={1.5}
					strokeDasharray="4 4"
				/>
				<text
					x="590"
					y={bandToY(TARGET) - 4}
					textAnchor="end"
					fontSize="10"
					fontWeight="700"
					fill="var(--color-destructive)"
				>
					B2 = {TARGET}
				</text>

				{/* Avg trend line */}
				<polyline
					points={TESTS.map((t, i) => `${centers[i]},${bandToY(t.avg)}`).join(" ")}
					fill="none"
					stroke="var(--color-primary-dark)"
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				{TESTS.map((t, i) => (
					<g key={`avg-${t.date}`}>
						<circle
							cx={centers[i]}
							cy={bandToY(t.avg)}
							r={4}
							fill="white"
							stroke="var(--color-primary-dark)"
							strokeWidth={2}
						/>
						<text
							x={centers[i]}
							y={bandToY(t.avg) + 16}
							textAnchor="middle"
							fontSize="10"
							fontWeight="700"
							fill="var(--color-muted)"
						>
							{t.avg}
						</text>
					</g>
				))}
			</svg>
		</section>
	)
}
