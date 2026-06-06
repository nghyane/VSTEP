import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { PaginatedGrid } from "#/components/PaginatedGrid"
import { PaginationControls } from "#/components/PaginationControls"
import { ExerciseCard } from "#/features/practice/components/ExerciseCard"
import { mcqProgressQuery, readingExercisesQuery } from "#/features/practice/queries"
import type { ReadingExercise } from "#/features/practice/types"
import { paginationMetaOrDefault } from "#/lib/api"

const PARTS = [
	{ part: 1, label: "Part 1 — Đọc hiểu ngắn", desc: "Đọc đoạn văn ngắn, trả lời câu hỏi" },
	{
		part: 2,
		label: "Part 2 — Đọc hiểu trung bình",
		desc: "Đọc đoạn văn trung bình, trả lời câu hỏi chi tiết",
	},
	{ part: 3, label: "Part 3 — Đọc hiểu dài", desc: "Đọc bài viết dài, trả lời câu hỏi tổng hợp" },
	{
		part: 4,
		label: "Part 4 — Đọc hiểu nâng cao",
		desc: "Đọc văn bản học thuật, trả lời câu hỏi suy luận",
	},
]

const PAGE_SIZE = 12

export function ReadingContent() {
	const { data: progressData } = useQuery(mcqProgressQuery("reading"))
	const progress = progressData?.data ?? {}

	return (
		<div className="space-y-8">
			{PARTS.map((part) => (
				<ReadingPartSection key={part.part} {...part} progress={progress} />
			))}
		</div>
	)
}

function ReadingPartSection({
	part,
	label,
	desc,
	progress,
}: {
	part: number
	label: string
	desc: string
	progress: Record<string, { score: number; total: number }>
}) {
	const [page, setPage] = useState(1)
	const { data, isLoading } = useQuery(readingExercisesQuery({ part, page, perPage: PAGE_SIZE }))
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
						{list.map((ex) => (
							<ReadingCard key={ex.id} exercise={ex} progress={progress[ex.id]} />
						))}
					</PaginatedGrid>
					<PaginationControls
						currentPage={pagination.current_page}
						lastPage={pagination.last_page}
						total={pagination.total}
						itemLabel="bài đọc"
						onPageChange={setPage}
					/>
				</>
			)}
		</section>
	)
}

function ReadingCard({
	exercise,
	progress,
}: {
	exercise: ReadingExercise
	progress: { score: number; total: number } | undefined
}) {
	const pct = progress && progress.total > 0 ? Math.round((progress.score / progress.total) * 100) : 0

	return (
		<ExerciseCard
			title={exercise.title}
			description={exercise.description}
			meta={exercise.estimated_minutes ? `~${exercise.estimated_minutes} phút` : ""}
			progress={
				progress
					? {
							status: pct >= 80 ? "completed" : "in_progress",
							score: progress.score,
							total: progress.total,
						}
					: undefined
			}
			overlay={
				<Link
					to="/reading/$exerciseId"
					params={{ exerciseId: exercise.id }}
					className="absolute inset-0 rounded-(--radius-card)"
				/>
			}
		/>
	)
}
