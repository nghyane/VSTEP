import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { vocabSrsQueueQuery } from "#/features/vocab/queries"

export function SrsHero() {
	const { data, isLoading } = useQuery(vocabSrsQueueQuery)

	if (isLoading) {
		return (
			<section className="card p-6 md:p-8">
				<p className="text-muted">Đang tải...</p>
			</section>
		)
	}

	if (!data) return null

	const queue = data.data
	const totalDue = queue.new_count + queue.learning_count + queue.review_count

	return (
		<section className="card overflow-hidden">
			<div className="flex items-center gap-6 p-6 md:p-8">
				<img src="/mascot/lac-vocabulary.png" alt="Lạc" className="w-36 h-36 object-contain shrink-0 hidden md:block" />
				<div className="flex-1">
					{totalDue > 0 ? (
						<>
							<h2 className="font-extrabold text-2xl text-foreground mb-3">Ôn tập hôm nay</h2>
							<div className="flex gap-4 mb-5">
								{queue.new_count > 0 && <span className="text-sm font-bold text-info">{queue.new_count} mới</span>}
								{queue.learning_count > 0 && <span className="text-sm font-bold text-warning">{queue.learning_count} đang học</span>}
								{queue.review_count > 0 && <span className="text-sm font-bold text-primary">{queue.review_count} ôn tập</span>}
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
	)
}
