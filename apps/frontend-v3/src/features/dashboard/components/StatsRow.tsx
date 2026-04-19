import { useQuery } from "@tanstack/react-query"
import { StaticIcon } from "#/components/Icon"
import { overviewQuery } from "#/features/dashboard/queries"
import { formatMinutes } from "#/lib/utils"
import { getTargetBand } from "#/lib/vstep"

function selectStatsView(raw: {
	data: {
		stats: { total_tests: number; min_tests_required: number; total_study_minutes: number; streak: number }
		chart: {
			listening: number | null
			reading: number | null
			writing: number | null
			speaking: number | null
		} | null
		profile: { target_level: string | null }
	}
}) {
	const { stats, chart, profile } = raw.data
	const scores = chart
		? [chart.listening, chart.reading, chart.writing, chart.speaking].filter((v): v is number => v !== null)
		: []
	const avgBand =
		scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null
	return { ...stats, avgBand, targetLevel: profile.target_level }
}

export function StatsRow() {
	const { data: stats } = useQuery({ ...overviewQuery, select: selectStatsView })
	if (!stats) return null

	return (
		<section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
			<div className="card p-4">
				<div className="flex items-center gap-3">
					<StaticIcon name="streak-md" size="lg" />
					<div className="min-w-0">
						<p className="text-sm text-subtle">Streak hiện tại</p>
						<p className="font-extrabold text-2xl text-foreground">{stats.streak} ngày</p>
					</div>
				</div>
			</div>
			<div className="card p-4">
				<div className="flex items-center gap-3">
					<StaticIcon name="timer-md" size="lg" />
					<div className="min-w-0">
						<p className="text-sm text-subtle">Thời gian luyện tập</p>
						<p className="font-extrabold text-2xl text-foreground">
							{formatMinutes(stats.total_study_minutes)}
						</p>
					</div>
				</div>
			</div>
			<div className="card p-4">
				<div className="flex items-center gap-3">
					<StaticIcon name="target-md" size="lg" />
					<div className="min-w-0">
						<p className="text-sm text-subtle">Bài thi thử</p>
						<p className="font-extrabold text-2xl text-foreground">
							{stats.total_tests}
							<span className="text-sm text-subtle font-normal"> / {stats.min_tests_required}</span>
						</p>
					</div>
				</div>
			</div>
			<div className="card p-4">
				<div className="flex items-center gap-3">
					<StaticIcon name="trophy" size="lg" />
					<div className="min-w-0">
						<p className="text-sm text-subtle">Band ước tính</p>
						<p
							className={`font-extrabold text-2xl ${stats.avgBand !== null ? "text-foreground" : "text-subtle"}`}
						>
							{stats.avgBand ?? "—"}
						</p>
						{stats.avgBand === null && stats.total_tests < stats.min_tests_required && (
							<p className="text-xs text-placeholder">
								Cần {stats.min_tests_required - stats.total_tests} bài nữa
							</p>
						)}
					</div>
				</div>
			</div>
		</section>
	)
}
