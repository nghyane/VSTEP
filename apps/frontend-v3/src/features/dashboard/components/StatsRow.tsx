import { useQuery } from "@tanstack/react-query"
import { StaticIcon } from "#/components/Icon"
import { overviewQuery, selectStats } from "#/features/dashboard/queries"
import { cn, formatMinutes } from "#/lib/utils"

export function StatsRow() {
	const { data: stats } = useQuery({ ...overviewQuery, select: selectStats })
	if (!stats) return null

	return (
		<section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
			<div className="card p-4 flex items-center">
				<div className="flex items-center gap-3 w-full">
					<StaticIcon name="streak-md" size="lg" />
					<div className="min-w-0">
						<p className="text-sm text-subtle">Streak hiện tại</p>
						<p className="font-extrabold text-2xl text-foreground">{stats.streak} ngày</p>
					</div>
				</div>
			</div>
			<div className="card p-4 flex items-center">
				<div className="flex items-center gap-3 w-full">
					<StaticIcon name="timer-md" size="lg" />
					<div className="min-w-0">
						<p className="text-sm text-subtle">Thời gian luyện tập</p>
						<p className="font-extrabold text-2xl text-foreground">
							{formatMinutes(stats.total_study_minutes)}
						</p>
					</div>
				</div>
			</div>
			<div className="card p-4 flex items-center">
				<div className="flex items-center gap-3 w-full">
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
			<div className="card p-4 flex items-center">
				<div className="flex items-center gap-3 w-full">
					<StaticIcon name="trophy" size="lg" />
					<div className="min-w-0">
						<p className="text-sm text-subtle">Band ước tính</p>
						<p
							className={cn(
								"font-extrabold text-2xl",
								stats.avgBand !== null ? "text-foreground" : "text-subtle",
							)}
						>
							{stats.avgBand !== null ? stats.avgBand : "—"}
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
