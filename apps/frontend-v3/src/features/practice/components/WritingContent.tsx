import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { PaginatedGrid } from "#/components/PaginatedGrid"
import { PaginationControls } from "#/components/PaginationControls"
import { ExerciseCard } from "#/features/practice/components/ExerciseCard"
import { writingPromptsQuery } from "#/features/practice/queries"
import type { WritingPrompt } from "#/features/practice/types"
import { paginationMetaOrDefault } from "#/lib/api"

const PARTS = [
	{
		part: 1,
		label: "Task 1 — Viết thư",
		desc: "Viết thư theo tình huống. Nhận phản hồi về cấu trúc, ngữ pháp, từ vựng.",
	},
	{
		part: 2,
		label: "Task 2 — Viết luận",
		desc: "Viết luận nghị luận. Nhận phản hồi về lập luận, mạch lạc, ngôn ngữ.",
	},
]

const PAGE_SIZE = 12

export function WritingContent() {
	return (
		<div className="space-y-8">
			{PARTS.map((part) => (
				<WritingPartSection key={part.part} {...part} />
			))}
		</div>
	)
}

function WritingPartSection({ part, label, desc }: { part: number; label: string; desc: string }) {
	const [page, setPage] = useState(1)
	const { data, isLoading } = useQuery(writingPromptsQuery({ part, page, perPage: PAGE_SIZE }))
	const list = data?.data ?? []
	const pagination = paginationMetaOrDefault(data, page, PAGE_SIZE)

	return (
		<section>
			<h3 className="font-extrabold text-xl text-foreground">{label}</h3>
			<p className="text-sm text-subtle mt-0.5 mb-4">{desc}</p>
			{isLoading || !data ? (
				<p className="text-sm text-subtle">Đang tải...</p>
			) : list.length === 0 ? (
				<div className="card p-6 text-center">
					<p className="text-sm text-subtle">Sắp ra mắt</p>
				</div>
			) : (
				<>
					<PaginatedGrid
						itemCount={list.length}
						pageSize={PAGE_SIZE}
						hasPagination={pagination.last_page > 1}
					>
						{list.map((prompt) => (
							<WritingCard key={prompt.id} prompt={prompt} />
						))}
					</PaginatedGrid>
					<PaginationControls
						currentPage={pagination.current_page}
						lastPage={pagination.last_page}
						total={pagination.total}
						itemLabel="đề viết"
						onPageChange={setPage}
					/>
				</>
			)}
		</section>
	)
}

function WritingCard({ prompt }: { prompt: WritingPrompt }) {
	return (
		<ExerciseCard
			title={prompt.title}
			description={prompt.description}
			meta={`${prompt.min_words}–${prompt.max_words} từ${prompt.estimated_minutes ? ` · ~${prompt.estimated_minutes} phút` : ""}`}
			tag={prompt.has_submitted ? "Đã làm" : undefined}
			overlay={
				<Link
					to="/writing/$promptId"
					params={{ promptId: prompt.id }}
					className="absolute inset-0 rounded-(--radius-card)"
				/>
			}
		/>
	)
}
