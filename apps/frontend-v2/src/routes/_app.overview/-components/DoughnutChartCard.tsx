// DoughnutChartCard — tổng số bài test per kỹ năng
// Spec: rounded-2xl bg-muted/50 p-5 shadow-sm
// Dùng inline SVG, CSS layout giống frontend-v1

import type { OverviewData } from "#/mocks/overview"
import { cn } from "#/shared/lib/utils"

type Skill = "listening" | "reading" | "writing" | "speaking"

const SKILL_CONFIG: { key: Skill; label: string; color: string }[] = [
	{ key: "listening", label: "Listening", color: "var(--color-skill-listening)" },
	{ key: "reading", label: "Reading", color: "var(--color-skill-reading)" },
	{ key: "writing", label: "Writing", color: "var(--color-skill-writing)" },
	{ key: "speaking", label: "Speaking", color: "var(--color-skill-speaking)" },
]

interface Props {
	skills: OverviewData["skills"]
}

// ─── SVG Doughnut ────────────────────────────────────────────────

function DoughnutSVG({ skills }: Props) {
	const segments = SKILL_CONFIG.map((c) => {
		const sk = skills.find((s) => s.skill === c.key)
		return { ...c, value: sk?.attemptCount ?? 0 }
	})
	const total = segments.reduce((acc, s) => acc + s.value, 0)

	const R = 70
	const CX = 100
	const CY = 100
	const circumference = 2 * Math.PI * R
	const strokeWidth = 28

	let offset = 0
	const paths = segments.map((seg) => {
		const pct = total > 0 ? seg.value / total : 0
		const dash = pct * circumference
		const currentOffset = offset
		offset += dash
		return {
			...seg,
			dash,
			gap: circumference - dash,
			offsetDeg: (currentOffset / circumference) * 360,
		}
	})

	return (
		<div className="mx-auto aspect-square max-h-[250px]">
			<svg viewBox="0 0 200 200" aria-label="Doughnut chart bài test" className="h-full w-full">
				<circle
					cx={CX}
					cy={CY}
					r={R}
					fill="none"
					stroke="hsl(var(--muted))"
					strokeWidth={strokeWidth}
				/>

				{total === 0
					? null
					: paths.map((seg) =>
							seg.value === 0 ? null : (
								<circle
									key={seg.key}
									cx={CX}
									cy={CY}
									r={R}
									fill="none"
									stroke={seg.color}
									strokeWidth={strokeWidth}
									strokeDasharray={`${seg.dash} ${seg.gap}`}
									strokeDashoffset={0}
									transform={`rotate(${seg.offsetDeg - 90} ${CX} ${CY})`}
								/>
							),
						)}

				<text
					x={CX}
					y={CY}
					textAnchor="middle"
					dominantBaseline="central"
					className="fill-foreground text-3xl font-bold"
					fontSize={28}
					fontWeight={800}
				>
					{total}
				</text>
			</svg>
		</div>
	)
}

// ─── Card ───────────────────────────────────────────────────────

export function DoughnutChartCard({ skills }: Props) {
	const segments = SKILL_CONFIG.map((c) => {
		const sk = skills.find((s) => s.skill === c.key)
		return { ...c, value: sk?.attemptCount ?? 0 }
	})

	return (
		<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
			<h3 className="text-lg font-semibold">Tổng số bài test đã hoàn thành</h3>
			<p className="mb-4 text-sm text-muted-foreground">trong Test Practice</p>

			<DoughnutSVG skills={skills} />

			<div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1">
				{segments.map((seg) => (
					<span key={seg.key} className="flex items-center gap-1.5 text-sm">
						<span
							className="inline-block size-2.5 rounded-full"
							style={{ backgroundColor: seg.color }}
						/>
						{seg.label}
						<span className="font-medium tabular-nums">{seg.value}</span>
					</span>
				))}
			</div>

			<div className="mt-3 flex flex-wrap justify-center gap-2">
				{SKILL_CONFIG.map((c) => (
					<span key={c.key} className={cn("cursor-pointer text-xs text-primary hover:underline")}>
						{c.label} chi tiết →
					</span>
				))}
			</div>
		</div>
	)
}
