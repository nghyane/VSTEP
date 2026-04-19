import { SKILL_CONFIG, type SkillKey } from "#/lib/skills"

const SKILL_KEYS: SkillKey[] = ["listening", "reading", "writing", "speaking"]

interface TestResult {
	date: string
	scores: Record<SkillKey, number>
	avg: number
}

// Mock data — backend chưa có endpoint list exam sessions with per-skill scores.
// Cần thêm: GET /api/v1/exam-sessions?status=graded (RFC 0003 không có, cần bổ sung)
const MOCK_TESTS: TestResult[] = [
	{ date: "01/03", scores: { listening: 5, reading: 6, writing: 4, speaking: 0 }, avg: 3.75 },
	{ date: "10/03", scores: { listening: 5.5, reading: 6, writing: 4.5, speaking: 0 }, avg: 4.0 },
	{ date: "18/03", scores: { listening: 6, reading: 6.5, writing: 5, speaking: 5 }, avg: 5.6 },
	{ date: "28/03", scores: { listening: 6, reading: 7, writing: 5.5, speaking: 5.5 }, avg: 6.0 },
	{ date: "05/04", scores: { listening: 6.5, reading: 7, writing: 6, speaking: 6 }, avg: 6.4 },
]

const TARGET = 6.0
const Y_MAX = 180
const Y_MIN = 20
const bandToY = (v: number) => Y_MAX - (v / 10) * (Y_MAX - Y_MIN)

export function ScoreTrend() {
	const spacing = 98
	const startX = 78
	const centers = MOCK_TESTS.map((_, i) => startX + i * spacing)

	return (
		<section className="card p-6">
			<h3 className="font-extrabold text-lg text-foreground">Điểm qua các lần thi</h3>
			<p className="text-sm text-subtle mt-1">
				{MOCK_TESTS.length} bài thi gần nhất · bấm để ẩn/hiện kỹ năng
			</p>

			<div className="flex flex-wrap gap-2 mt-3 mb-4">
				{SKILL_KEYS.map((key) => {
					const config = SKILL_CONFIG[key]
					return (
						<button
							type="button"
							key={key}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
							style={{
								color: config.color,
								background: `color-mix(in srgb, ${config.color} 10%, transparent)`,
							}}
						>
							<span className="w-2 h-2 rounded-full" style={{ background: config.color }} />
							{config.label}
						</button>
					)
				})}
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

				{MOCK_TESTS.map((test, ti) => {
					const cx = centers[ti] ?? 0
					return (
						<g key={test.date}>
							{SKILL_KEYS.map((key, si) => {
								const v = test.scores[key]
								const config = SKILL_CONFIG[key]
								return (
									<rect
										key={key}
										x={cx - 30 + si * 16}
										y={bandToY(v)}
										width={14}
										height={Math.max(0, Y_MAX - bandToY(v))}
										fill={config.color}
										rx={3}
										opacity={0.65}
									/>
								)
							})}
							<text x={cx} y={198} textAnchor="middle" fontSize="10" fill="var(--color-subtle)">
								{test.date}
							</text>
						</g>
					)
				})}

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

				<polyline
					points={MOCK_TESTS.map((t, i) => `${centers[i]},${bandToY(t.avg)}`).join(" ")}
					fill="none"
					stroke="var(--color-primary-dark)"
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				{MOCK_TESTS.map((t, i) => (
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
