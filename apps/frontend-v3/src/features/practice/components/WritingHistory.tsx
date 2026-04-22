import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { writingHistoryQuery } from "#/features/practice/queries"
import { formatShortDate } from "#/lib/utils"

export function WritingHistory() {
	const { data } = useQuery(writingHistoryQuery)
	const items = data?.data ?? []

	if (items.length === 0) return null

	return (
		<section>
			<h3 className="font-extrabold text-xl text-foreground">Bài đã nộp</h3>
			<p className="text-sm text-subtle mt-0.5 mb-4">Xem lại kết quả AI chấm</p>
			<div className="space-y-2">
				{items.map((item) => (
					<Link
						key={item.id}
						to="/grading/writing/$submissionId"
						params={{ submissionId: item.id }}
						className="card-interactive flex items-center gap-4 p-4"
					>
						<div className="flex-1 min-w-0">
							<p className="font-bold text-sm text-foreground truncate">{item.prompt?.title ?? "Bài viết"}</p>
							<p className="text-xs text-muted mt-0.5">
								{formatShortDate(item.submitted_at)} · {item.word_count} từ
								{item.prompt ? ` · Part ${item.prompt.part}` : ""}
							</p>
						</div>
						<span className="text-xs font-bold text-primary shrink-0">Xem điểm →</span>
					</Link>
				))}
			</div>
		</section>
	)
}
