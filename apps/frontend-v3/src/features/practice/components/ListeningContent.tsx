import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { PaginatedGrid } from "#/components/PaginatedGrid"
import { PaginationControls } from "#/components/PaginationControls"
import { ExerciseCard } from "#/features/practice/components/ExerciseCard"
import { listeningExercisesQuery, mcqProgressQuery } from "#/features/practice/queries"
import type { ListeningExerciseSummary } from "#/features/practice/types"
import { paginationMetaOrDefault } from "#/lib/api"

const PARTS = [
	{ part: 1, label: "Part 1 — Nghe hiểu ngắn", desc: "Nghe đoạn hội thoại ngắn, trả lời câu hỏi" },
	{ part: 2, label: "Part 2 — Nghe hiểu hội thoại", desc: "Nghe hội thoại dài, trả lời câu hỏi chi tiết" },
	{ part: 3, label: "Part 3 — Nghe hiểu bài giảng", desc: "Nghe bài giảng/thuyết trình, trả lời câu hỏi" },
]

const PAGE_SIZE = 12

export function ListeningContent() {
	const { data: progressData } = useQuery(mcqProgressQuery("listening"))
	const progress = progressData?.data ?? {}

	return (
		<div className="space-y-8">
			{PARTS.map((part) => (
				<ListeningPartSection key={part.part} {...part} progress={progress} />
			))}
		</div>
	)
}

function ListeningPartSection({
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
	const { data, isLoading } = useQuery(listeningExercisesQuery({ part, page, perPage: PAGE_SIZE }))
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
							<ListeningCard key={ex.id} exercise={ex} progress={progress[ex.id]} />
						))}
					</PaginatedGrid>
					<PaginationControls
						currentPage={pagination.current_page}
						lastPage={pagination.last_page}
						total={pagination.total}
						itemLabel="bài nghe"
						onPageChange={setPage}
					/>
				</>
			)}
		</section>
	)
}

function ListeningCard({
	exercise,
	progress,
}: {
	exercise: ListeningExerciseSummary
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
					to="/listening/$exerciseId"
					params={{ exerciseId: exercise.id }}
					className="absolute inset-0 rounded-(--radius-card)"
				/>
			}
		/>
	)
}
