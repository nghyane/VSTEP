import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { writingHistoryQuery } from "#/features/practice/queries"
import type { WritingHistoryItem } from "#/features/practice/types"
import { formatShortDate } from "#/lib/utils"

export function GradingHistory() {
	const { data: wData } = useQuery(writingHistoryQuery)
	const items = wData?.data ?? []

	if (!wData) return <p className="text-muted">Đang tải...</p>

	if (items.length === 0) {
		return (
			<div className="card p-8 text-center">
				<p className="text-muted">Chưa có bài nào được AI chấm</p>
				<p className="text-xs text-subtle mt-1">Nộp bài Viết để xem kết quả tại đây</p>
			</div>
		)
	}

	return (
		<div className="space-y-2">
			{items.map((w) => (
				<Link
					key={w.id}
					to="/grading/assessment/$attemptId"
					params={{ attemptId: w.attempt_id }}
					className="card-interactive flex items-center gap-4 p-4"
				>
					<HistoryRow item={w} />
				</Link>
			))}
		</div>
	)
}

function HistoryRow({ item }: { item: WritingHistoryItem }) {
	return (
		<>
			<span className="w-8 h-8 rounded-lg bg-skill-writing/10 text-skill-writing flex items-center justify-center text-xs font-bold shrink-0">
				W
			</span>
			<div className="flex-1 min-w-0">
				<p className="font-bold text-sm text-foreground truncate">{item.prompt?.title ?? "Bài viết"}</p>
				<p className="text-xs text-muted mt-0.5">
					{formatShortDate(item.submitted_at)} · {item.word_count} từ
				</p>
			</div>
			<span className="text-xs font-bold text-skill-writing shrink-0">Xem điểm →</span>
		</>
	)
}
