import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { ExamCard } from "./-components/thi-thu/ExamCard"
import { ExamSidebarFilters } from "./-components/thi-thu/ExamSidebarFilters"

export const Route = createFileRoute("/_app/thi-thu/")({
	component: ThiThuPage,
})

const ALL_EXAMS = [1, 2, 3, 4, 5, 6].map((i) => ({ id: i }))

function ThiThuPage() {
	const [searchQuery, setSearchQuery] = useState("")

	const filteredExams = ALL_EXAMS.filter((exam) => {
		if (!searchQuery.trim()) return true
		return `Đề thi VSTEP HNUE 08/02/2026 #${exam.id}`
			.toLowerCase()
			.includes(searchQuery.toLowerCase())
	})

	return (
		<div className="mx-auto w-full max-w-5xl space-y-8 pb-10 pt-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold">Thư viện đề thi VSTEP</h1>
				<p className="text-sm text-muted-foreground">
					Luyện tập với hàng trăm đề thi bám sát cấu trúc thật.
				</p>
			</div>

			<section className="flex flex-col gap-8 md:flex-row md:items-start">
				<ExamSidebarFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} />

				<div className="flex-1 space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						{filteredExams.map((exam) => (
							<ExamCard key={exam.id} id={exam.id} />
						))}
					</div>

					{filteredExams.length === 0 && (
						<div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card py-12 text-center">
							<p className="text-sm font-medium text-muted-foreground">
								Không tìm thấy đề thi phù hợp
							</p>
						</div>
					)}
				</div>
			</section>
		</div>
	)
}
