import { useQuery } from "@tanstack/react-query"
import { Icon } from "#/components/Icon"
import { overviewQuery, selectNextAction } from "#/features/dashboard/queries"

export function NextAction() {
	const { data } = useQuery({ ...overviewQuery, select: selectNextAction })
	if (!data) return null

	return (
		<section className="card p-5 flex items-center gap-5">
			<Icon name="weights" size="lg" />
			<div className="flex-1 min-w-0">
				<h4 className="font-bold text-base text-foreground">Bạn chưa luyện tập hôm nay!</h4>
				<p className="text-sm text-subtle mt-0.5">
					Gợi ý: Luyện {data.skill.label} · 15 phút · Giữ streak {data.streak + 1} ngày
				</p>
			</div>
			<button type="button" className="btn btn-primary shrink-0">
				Bắt đầu
			</button>
		</section>
	)
}
