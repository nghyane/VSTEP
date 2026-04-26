import { useQuery } from "@tanstack/react-query"
import { Icon } from "#/components/Icon"
import { examSessionsQuery } from "#/features/dashboard/queries"
import type { ExamSessionResult } from "#/features/dashboard/types"
import { skills } from "#/lib/skills"

const SIZE = 200
const CENTER = SIZE / 2
const RADIUS = 70
const STROKE = 28
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function countBySkill(sessions: ExamSessionResult[]): Record<string, number> {
	const result: Record<string, number> = { listening: 0, reading: 0, writing: 0, speaking: 0 }
	for (const s of sessions) {
		if (s.submitted_at === null || !s.scores) continue
		for (const sk of skills) {
			if (s.scores[sk.key] !== null && s.scores[sk.key] !== undefined) {
				result[sk.key] = (result[sk.key] ?? 0) + 1
			}
		}
	}
	return result
}

export function DoughnutCard() {
	const { data: sessions } = useQuery(examSessionsQuery)
	if (!sessions) return null

	const counts = countBySkill(sessions)
	const total = skills.reduce((acc, s) => acc + (counts[s.key] ?? 0), 0)

	let cursor = 0
	const segments = skills.map((s) => {
		const value = counts[s.key] ?? 0
		const pct = total > 0 ? value / total : 0
		const dash = pct * CIRCUMFERENCE
		const offset = cursor
		cursor += dash
		return { skill: s, value, dash, offsetDeg: (offset / CIRCUMFERENCE) * 360 }
	})

	return (
		<div className="card p-6 flex flex-col">
			<h3 className="font-extrabold text-lg text-foreground">Số bài thi đã làm</h3>
			<p className="text-sm text-subtle mt-1">
				{total > 0 ? `Tổng ${total} lượt làm theo từng kỹ năng` : "Chưa có bài thi nào được hoàn thành"}
			</p>

			<div className="flex-1 flex items-center justify-center py-4">
				<svg
					viewBox={`0 0 ${SIZE} ${SIZE}`}
					className="w-full max-w-[300px] aspect-square"
					role="img"
					aria-label="Tổng số bài thi theo kỹ năng"
				>
					<circle
						cx={CENTER}
						cy={CENTER}
						r={RADIUS}
						fill="none"
						stroke="var(--color-background)"
						strokeWidth={STROKE}
					/>
					{total > 0 &&
						segments.map((seg) =>
							seg.value === 0 ? null : (
								<circle
									key={seg.skill.key}
									cx={CENTER}
									cy={CENTER}
									r={RADIUS}
									fill="none"
									stroke={seg.skill.color}
									strokeWidth={STROKE}
									strokeDasharray={`${seg.dash} ${CIRCUMFERENCE - seg.dash}`}
									strokeDashoffset={0}
									transform={`rotate(${seg.offsetDeg - 90} ${CENTER} ${CENTER})`}
									strokeLinecap="butt"
								/>
							),
						)}
					<text
						x={CENTER}
						y={CENTER - 6}
						textAnchor="middle"
						dominantBaseline="central"
						fontSize={36}
						fontWeight={800}
						fill="var(--color-foreground)"
					>
						{total}
					</text>
					<text
						x={CENTER}
						y={CENTER + 22}
						textAnchor="middle"
						dominantBaseline="central"
						fontSize={11}
						fontWeight={700}
						fill="var(--color-subtle)"
					>
						LƯỢT
					</text>
				</svg>
			</div>

			<div className="grid grid-cols-2 gap-2 mt-2">
				{skills.map((s) => {
					const value = counts[s.key] ?? 0
					return (
						<div key={s.key} className="flex items-center gap-2 rounded-(--radius-button) p-2 text-sm">
							<Icon name={s.icon} size="xs" style={{ color: s.color }} />
							<span className="font-bold text-foreground">{s.label}</span>
							<span className="ml-auto text-lg tabular-nums font-extrabold" style={{ color: s.color }}>
								{value}
							</span>
						</div>
					)
				})}
			</div>
		</div>
	)
}
