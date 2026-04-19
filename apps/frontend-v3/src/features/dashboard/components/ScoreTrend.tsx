import { useQuery } from "@tanstack/react-query"
import { type ExamSessionResult, examSessionsQuery } from "#/features/dashboard/queries"
import { SKILL_CONFIG, type SkillKey } from "#/lib/skills"
import { formatShortDate, round } from "#/lib/utils"

const SKILL_KEYS: SkillKey[] = ["listening", "reading", "writing", "speaking"]
const TARGET = 6.0
const Y_MAX = 180
const Y_MIN = 20
const bandToY = (v: number) => Y_MAX - (v / 10) * (Y_MAX - Y_MIN)

function computeAvg(scores: Record<SkillKey, number | null>): number {
	const vals = SKILL_KEYS.map((k) => scores[k]).filter((v): v is number => v !== null)
	return vals.length > 0 ? round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
}

export function ScoreTrend() {
	const { data, isLoading } = useQuery(examSessionsQuery)
	const sessions = data?.data ?? []

	if (isLoading) {
		return (
			<section className="card p-6">
				<h3 className="font-extrabold text-lg text-foreground">Điểm qua các lần thi</h3>
				<p className="text-sm text-subtle mt-1">Đang tải...</p>
			</section>
		)
	}

	if (sessions.length === 0) {
		return (
			<section className="card p-6">
				<h3 className="font-extrabold text-lg text-foreground">Điểm qua các lần thi</h3>
				<p className="text-sm text-subtle mt-1">Chưa có bài thi thử nào</p>
			</section>
		)
	}

	const tests = sessions.slice(0, 10).reverse()
	const spacing = Math.min(98, 500 / tests.length)
	const startX = 78
	const centers = tests.map((_, i) => startX + i * spacing)

	return (
		<section className="card p-6">
			<h3 className="font-extrabold text-lg text-foreground">Điểm qua các lần thi</h3>
			<p className="text-sm text-subtle mt-1">{tests.length} bài thi gần nhất · bấm để ẩn/hiện kỹ năng</p>

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

				{tests.map((test, ti) => {
					const cx = centers[ti] ?? 0
					return (
						<g key={test.id}>
							{SKILL_KEYS.map((key, si) => {
								const v = test.scores[key] ?? 0
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
								{formatShortDate(test.submitted_at)}
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
					points={tests.map((t, i) => `${centers[i]},${bandToY(computeAvg(t.scores))}`).join(" ")}
					fill="none"
					stroke="var(--color-primary-dark)"
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				{tests.map((t, i) => {
					const avg = computeAvg(t.scores)
					return (
						<g key={`avg-${t.id}`}>
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
			</svg>
		</section>
	)
}
