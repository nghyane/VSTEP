import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Icon } from "#/components/Icon"
import { streakQuery } from "#/features/dashboard/queries"

export function NextAction() {
	const { data } = useQuery(streakQuery)
	if (!data) return null

	const { today_sessions, daily_goal, current_streak } = data.data
	if (today_sessions >= daily_goal) return null

	return (
		<section className="card p-5 flex items-center gap-5">
			<Icon name="weights" size="lg" />
			<div className="flex-1 min-w-0">
				<h4 className="font-bold text-base text-foreground">Hôm nay chưa làm bài thi nào!</h4>
				<p className="text-sm text-subtle mt-0.5">
					Cần {daily_goal - today_sessions} bài full-test để giữ streak {current_streak + 1} ngày
				</p>
			</div>
			<Link to="/thi-thu" className="btn btn-primary shrink-0">
				Bắt đầu
			</Link>
		</section>
	)
}
