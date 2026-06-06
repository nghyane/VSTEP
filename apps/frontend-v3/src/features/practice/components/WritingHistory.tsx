import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { PaginationControls } from "#/components/PaginationControls"
import { writingHistoryQuery } from "#/features/practice/queries"
import { paginationMetaOrDefault } from "#/lib/api"
import { formatShortDate } from "#/lib/utils"

const PAGE_SIZE = 10

export function WritingHistory() {
	const [page, setPage] = useState(1)
	const { data } = useQuery(writingHistoryQuery(page, PAGE_SIZE))
	const items = data?.data ?? []
	const pagination = paginationMetaOrDefault(data, page, PAGE_SIZE)

	if (items.length === 0) return null

	return (
		<section>
			<h3 className="font-extrabold text-xl text-foreground">Bài đã nộp</h3>
			<p className="text-sm text-subtle mt-0.5 mb-4">Xem lại điểm tham khảo và phản hồi rubric</p>
			<div className="space-y-2">
				{items.map((item) => (
					<Link
						key={item.id}
						to="/grading/assessment/$attemptId"
						params={{ attemptId: item.attempt_id }}
						className="card-interactive flex items-center gap-4 p-4"
					>
						<div className="flex-1 min-w-0">
							<p className="font-bold text-sm text-foreground truncate">{item.prompt?.title ?? "Bài viết"}</p>
							<p className="text-xs text-muted mt-0.5">
								{formatShortDate(item.submitted_at)} · {item.word_count} từ
								{item.prompt ? ` · Phần ${item.prompt.part}` : ""}
							</p>
						</div>
						<span className="text-xs font-bold text-primary shrink-0">Xem điểm →</span>
					</Link>
				))}
				{Array.from(
					{ length: pagination.last_page > 1 ? Math.max(0, PAGE_SIZE - items.length) : 0 },
					(_, index) => (
						<div
							key={`writing-history-placeholder-${index}`}
							aria-hidden="true"
							className="invisible min-h-[72px]"
						/>
					),
				)}
			</div>
			{data && (
				<PaginationControls
					currentPage={pagination.current_page}
					lastPage={pagination.last_page}
					total={pagination.total}
					itemLabel="bài đã nộp"
					onPageChange={setPage}
				/>
			)}
		</section>
	)
}
