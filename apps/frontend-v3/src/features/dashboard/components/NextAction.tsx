import { useQuery } from "@tanstack/react-query"
import weightsIcon from "#/assets/icons/weights-small.svg"
import { overviewQuery, selectStats } from "#/features/dashboard/queries"

export function NextAction() {
	const { data: stats } = useQuery({ ...overviewQuery, select: selectStats })

	return (
		<section className="card p-5 flex items-center gap-5">
			<img src={weightsIcon} className="w-10 h-auto shrink-0" alt="" />
			<div className="flex-1 min-w-0">
				<h4 className="font-bold text-base text-foreground">Bạn chưa luyện tập hôm nay!</h4>
				<p className="text-sm text-subtle mt-0.5">
					Gợi ý: Luyện Viết · 15 phút · Giữ streak {(stats?.streak ?? 0) + 1} ngày
				</p>
			</div>
			<button type="button" className="btn btn-primary shrink-0">
				Bắt đầu
			</button>
		</section>
	)
}
