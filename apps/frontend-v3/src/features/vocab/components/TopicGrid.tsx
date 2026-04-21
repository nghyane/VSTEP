import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { vocabTopicsQuery } from "#/features/vocab/queries"

export function TopicGrid() {
	const { data, isLoading } = useQuery(vocabTopicsQuery)
	const topics = data?.data ?? []

	return (
		<section>
			<h3 className="font-extrabold text-xl text-foreground mb-1">Chủ đề</h3>
			<p className="text-sm text-subtle mb-5">Chọn chủ đề để học từ mới</p>

			{isLoading ? (
				<p className="text-sm text-subtle">Đang tải...</p>
			) : topics.length === 0 ? (
				<div className="card p-10 text-center">
					<img src="/mascot/lac-think.png" alt="" className="w-24 h-24 mx-auto mb-3 object-contain" />
					<p className="text-sm font-bold text-subtle">Chưa có chủ đề nào</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{topics.map((t) => (
						<Link key={t.id} to="/luyen-tap/tu-vung/$topicId" params={{ topicId: t.id }} className="card-interactive p-5">
							<div className="flex items-center justify-between mb-2">
								<h4 className="font-bold text-base text-foreground">{t.name}</h4>
								<span className="text-xs font-bold text-primary bg-primary-tint px-2 py-0.5 rounded-full shrink-0 ml-2">{t.level}</span>
							</div>
							{t.description && <p className="text-sm text-subtle mb-3 line-clamp-2">{t.description}</p>}
							{t.tasks.length > 0 && (
								<div className="flex flex-wrap gap-1.5 mb-3">
									{t.tasks.map((task) => (
										<span key={task} className="text-xs text-muted bg-background px-2 py-0.5 rounded-full">{task}</span>
									))}
								</div>
							)}
							{t.word_count != null && <p className="text-xs font-bold text-subtle">{t.word_count} từ</p>}
						</Link>
					))}
				</div>
			)}
		</section>
	)
}
