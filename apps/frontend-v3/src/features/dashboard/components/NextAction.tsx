import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Icon } from "#/components/Icon"
import { streakQuery } from "#/features/dashboard/queries"

export function NextAction() {
	const { data } = useQuery(streakQuery)
	if (!data) return null

	const { today_sessions, daily_goal, current_streak } = data.data
	const done = today_sessions >= daily_goal

	const title = done
		? `Đã giữ streak hôm nay (${today_sessions}/${daily_goal} bài)`
		: `Hôm nay chưa làm bài thi nào!`
	const hint = done
		? `Streak hiện tại: ${current_streak} ngày · Làm thêm để luyện thêm kỹ năng`
		: `Cần ${daily_goal - today_sessions} bài full-test để giữ streak ${current_streak + 1} ngày`
	const cta = done ? "Làm thêm" : "Bắt đầu"

	return (
		<section className="card p-5 flex items-center gap-5">
			<Icon name="weights" size="lg" />
			<div className="flex-1 min-w-0">
				<h4 className="font-bold text-base text-foreground">{title}</h4>
				<p className="text-sm text-subtle mt-0.5">{hint}</p>
			</div>
			<Link to="/thi-thu" className="btn btn-primary shrink-0">
				{cta}
			</Link>
		</section>
	)
}
