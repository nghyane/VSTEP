import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { vocabTopicsQuery } from "#/features/vocab/queries"

export function TopicGrid() {
	const { data, isLoading } = useQuery(vocabTopicsQuery)

	return (
		<section>
			<h3 className="font-extrabold text-xl text-foreground mb-1">Chủ đề</h3>
			<p className="text-sm text-subtle mb-5">Chọn chủ đề để học từ mới</p>

			{isLoading || !data ? (
				<p className="text-sm text-subtle">Đang tải...</p>
			) : data.data.length === 0 ? (
				<div className="card p-10 text-center">
					<img src="/mascot/lac-think.png" alt="" className="w-24 h-24 mx-auto mb-3 object-contain" />
					<p className="text-sm font-bold text-subtle">Chưa có chủ đề nào</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{data.data.map((t) => {
						const learned = t.learned_count ?? 0
						const total = t.word_count ?? 0
						const pct = total > 0 ? Math.round((learned / total) * 100) : 0

						return (
							<Link
								key={t.id}
								to="/luyen-tap/tu-vung/$topicId"
								params={{ topicId: t.id }}
								className="card-interactive flex flex-col overflow-hidden"
							>
								<div className="p-5 flex flex-col flex-1">
									<div className="flex items-center justify-between mb-2">
										<h4 className="font-bold text-base text-foreground">{t.name}</h4>
										<span className="text-xs font-bold text-primary bg-primary-tint px-2 py-0.5 rounded-full shrink-0 ml-2">
											{t.level}
										</span>
									</div>
									{t.description && <p className="text-sm text-subtle mb-3 line-clamp-2">{t.description}</p>}
									{t.tasks.length > 0 && (
										<div className="flex flex-wrap gap-1.5">
											{t.tasks.map((task) => (
												<span key={task} className="text-xs text-muted bg-background px-2 py-0.5 rounded-full">
													{task}
												</span>
											))}
										</div>
									)}
								</div>
								{total > 0 && (
									<div className="mt-auto px-5 pb-4">
										<div className="flex items-center justify-between text-xs text-muted tabular-nums mb-1">
											<span>
												{learned}/{total} từ
											</span>
											<span className="font-bold">{pct}%</span>
										</div>
										<div className="h-1.5 bg-background rounded-full overflow-hidden">
											<div
												className="h-full bg-primary rounded-full transition-all"
												style={{ width: `${pct}%` }}
											/>
										</div>
									</div>
								)}
							</Link>
						)
					})}
				</div>
			)}
		</section>
	)
}
