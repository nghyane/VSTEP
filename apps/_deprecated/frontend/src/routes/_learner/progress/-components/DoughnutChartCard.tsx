import { Link } from "@tanstack/react-router"
import { DoughnutChart, DoughnutLegend } from "@/components/common/DoughnutChart"
import type { useProgress } from "@/hooks/use-progress"
import { SKILL_COLORS, SKILLS } from "./progress-constants"

export function DoughnutChartCard({
	progressData,
}: {
	progressData: ReturnType<typeof useProgress>["data"]
}) {
	const segments = SKILLS.map(({ key, label }) => {
		const sk = progressData?.skills.find((s) => s.skill === key)
		return {
			label,
			value: sk?.attemptCount ?? 0,
			color: SKILL_COLORS[key],
		}
	})
	const total = segments.reduce((s, seg) => s + seg.value, 0)

	return (
		<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
			<h3 className="text-lg font-semibold">Tổng số bài test đã hoàn thành</h3>
			<p className="mb-4 text-sm text-muted-foreground">trong Test Practice</p>
			<DoughnutChart segments={segments} centerLabel="Tổng số bài test" centerValue={total} />
			<DoughnutLegend segments={segments} className="mt-4 justify-center" />
			<div className="mt-3 flex flex-wrap justify-center gap-2">
				{SKILLS.map(({ key, label }) => (
					<Link
						key={key}
						to="/progress/$skill"
						params={{ skill: key }}
						className="text-xs text-primary hover:underline"
					>
						{label} chi tiết →
					</Link>
				))}
			</div>
		</div>
	)
}
