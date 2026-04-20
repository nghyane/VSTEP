import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { vocabSrsQueueQuery, vocabTopicsQuery } from "#/features/vocab/queries"

export const Route = createFileRoute("/_app/luyen-tap/tu-vung/")({
	component: VocabPage,
})

function VocabPage() {
	const { data: queueData, isLoading: queueLoading } = useQuery(vocabSrsQueueQuery)
	const { data: topicsData, isLoading: topicsLoading } = useQuery(vocabTopicsQuery)

	const queue = queueData?.data
	const topics = topicsData?.data ?? []
	const totalDue = queue ? queue.new_count + queue.learning_count + queue.review_count : 0

	return (
		<>
			<Header title="Từ vựng" />
			<div className="px-10 pb-12 space-y-8">
				{/* SRS Hero */}
				<section className="card overflow-hidden">
					<div className="flex items-center gap-6 p-6 md:p-8">
						<img
							src="/mascot/lac-vocabulary.png"
							alt="Lạc"
							className="w-36 h-36 object-contain shrink-0 hidden md:block"
						/>
						<div className="flex-1">
							{queueLoading ? (
								<p className="text-muted">Đang tải...</p>
							) : totalDue > 0 ? (
								<>
									<h2 className="font-extrabold text-2xl text-foreground mb-3">Ôn tập hôm nay</h2>
									<div className="flex gap-4 mb-5">
										{queue!.new_count > 0 && (
											<span className="text-sm font-bold text-info">
												{queue!.new_count} mới
											</span>
										)}
										{queue!.learning_count > 0 && (
											<span className="text-sm font-bold text-warning">
												{queue!.learning_count} đang học
											</span>
										)}
										{queue!.review_count > 0 && (
											<span className="text-sm font-bold text-primary">
												{queue!.review_count} ôn tập
											</span>
										)}
									</div>
									<Link to="/vocab/srs-review" className="btn btn-primary px-8 py-3 text-base">
										Bắt đầu · {totalDue} từ
									</Link>
								</>
							) : (
								<>
									<h2 className="font-extrabold text-2xl text-foreground mb-2">Hôm nay đã ôn xong!</h2>
									<p className="text-muted">Quay lại vào ngày mai hoặc chọn chủ đề mới bên dưới.</p>
								</>
							)}
						</div>
					</div>
				</section>

				{/* Topics grid */}
				<section>
					<h3 className="font-extrabold text-xl text-foreground mb-1">Chủ đề</h3>
					<p className="text-sm text-subtle mb-5">Chọn chủ đề để học từ mới</p>

					{topicsLoading ? (
						<p className="text-sm text-subtle">Đang tải...</p>
					) : topics.length === 0 ? (
						<div className="card p-10 text-center">
							<img src="/mascot/lac-think.png" alt="" className="w-24 h-24 mx-auto mb-3 object-contain" />
							<p className="text-sm font-bold text-subtle">Chưa có chủ đề nào</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{topics.map((t) => (
								<Link
									key={t.id}
									to="/luyen-tap/tu-vung/$topicId"
									params={{ topicId: t.id }}
									className="card-interactive p-5"
								>
									<div className="flex items-center justify-between mb-2">
										<h4 className="font-bold text-base text-foreground">{t.name}</h4>
										<span className="text-xs font-bold text-primary bg-primary-tint px-2 py-0.5 rounded-full shrink-0 ml-2">
											{t.level}
										</span>
									</div>
									{t.description && (
										<p className="text-sm text-subtle mb-3 line-clamp-2">{t.description}</p>
									)}
									{t.tasks.length > 0 && (
										<div className="flex flex-wrap gap-1.5 mb-3">
											{t.tasks.map((task) => (
												<span key={task} className="text-xs text-muted bg-background px-2 py-0.5 rounded-full">
													{task}
												</span>
											))}
										</div>
									)}
									{t.word_count != null && (
										<p className="text-xs font-bold text-subtle">{t.word_count} từ</p>
									)}
								</Link>
							))}
						</div>
					)}
				</section>
			</div>
		</>
	)
}
