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
	const reviewText = reviewSummary(queue.new_count, queue.learning_count, queue.review_count)

	return (
		<section className="card overflow-hidden">
			<div className="flex items-center gap-6 p-6 md:p-8">
				<img
					src="/mascot/lac-vocabulary.png"
					alt="Lạc"
					className="w-36 h-36 object-contain shrink-0 hidden md:block"
				/>
				<div className="flex-1">
					{totalDue > 0 ? (
						<>
							<h2 className="font-extrabold text-2xl text-foreground mb-1">Ôn tập từ vựng</h2>
							<p className="text-sm text-muted mb-2">Bạn có {totalDue} thẻ từ sẵn sàng hôm nay.</p>
							{reviewText && <p className="text-xs font-bold text-subtle mb-4">{reviewText}</p>}
							<Link to="/vocab/srs-review" className="btn btn-primary px-8 py-3 text-base">
								Bắt đầu ôn tập
							</Link>
						</>
					) : (
						<>
							<h2 className="font-extrabold text-2xl text-foreground mb-1">Tuyệt vời!</h2>
							<p className="text-sm text-muted">
								Bạn đã ôn xong tất cả từ vựng hôm nay. Hẹn gặp lại vào ngày mai!
							</p>
						</>
					)}
				</div>
			</div>
		</section>
	)
}

function reviewSummary(newCount: number, learningCount: number, reviewCount: number): string {
	const parts: string[] = []
	if (newCount > 0) parts.push(`${newCount} từ mới`)
	if (learningCount > 0) parts.push(`${learningCount} đang học`)
	if (reviewCount > 0) parts.push(`${reviewCount} cần ôn lại`)
	return parts.join(" · ")
}
