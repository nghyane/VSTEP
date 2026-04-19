import { useQuery } from "@tanstack/react-query"
import streakIcon from "#/assets/icons/streak-medium.svg"
import targetIcon from "#/assets/icons/target-medium.svg"
import timerIcon from "#/assets/icons/timer-medium.svg"
import trophyIcon from "#/assets/icons/trophy-small.svg"
import { overviewQuery, selectStats } from "#/features/dashboard/queries"
import { formatMinutes } from "#/lib/utils"

export function StatsRow() {
	const { data: stats } = useQuery({ ...overviewQuery, select: selectStats })
	if (!stats) return null

	return (
		<section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
			<div className="card p-4">
				<div className="flex items-center gap-3">
					<img src={streakIcon} className="w-10 h-10 object-contain" alt="" />
					<div className="min-w-0">
						<p className="text-sm text-subtle">Streak hiện tại</p>
						<p className="font-extrabold text-2xl text-foreground">{stats.streak} ngày</p>
					</div>
				</div>
			</div>
			<div className="card p-4">
				<div className="flex items-center gap-3">
					<img src={timerIcon} className="w-10 h-10 object-contain" alt="" />
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
					<img src={targetIcon} className="w-10 h-10 object-contain" alt="" />
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
					<img src={trophyIcon} className="w-10 h-10 object-contain" alt="" />
					<div className="min-w-0">
						<p className="text-sm text-subtle">Band ước tính</p>
						<p className="font-extrabold text-2xl text-subtle">—</p>
						{stats.total_tests < stats.min_tests_required && (
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
