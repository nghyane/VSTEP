import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Icon } from "#/components/Icon"
import { streakQuery } from "#/features/dashboard/queries"

export function NextAction() {
	const { data } = useQuery(streakQuery)
	if (!data) return null

	const { today_active, current, daily_goal: dailyGoal, today_count: todayCount } = data.data
	if (today_active) return null

	const remaining = Math.max(0, dailyGoal - todayCount)

	return (
		<section className="card p-5 flex items-center gap-5">
			<Icon name="weights" size="lg" />
			<div className="flex-1 min-w-0">
				<h4 className="font-bold text-base text-foreground">
					{todayCount > 0 ? `Còn ${remaining} hoạt động để giữ streak` : "Hôm nay chưa luyện tập!"}
				</h4>
				<p className="text-sm text-subtle mt-0.5">
					Đã hoàn thành {todayCount}/{dailyGoal} hoạt động hôm nay để duy trì streak {current} ngày
				</p>
			</div>
			<Link to="/luyen-tap" className="btn btn-primary shrink-0">
				Bắt đầu
			</Link>
		</section>
	)
}
