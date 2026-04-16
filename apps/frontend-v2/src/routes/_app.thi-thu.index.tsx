import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { DashboardGoalCard } from "./-components/thi-thu/DashboardGoalCard"
import { DashboardStreakCard } from "./-components/thi-thu/DashboardStreakCard"
import { ExamCard } from "./-components/thi-thu/ExamCard"
import { ExamSidebarFilters, type ExamType } from "./-components/thi-thu/ExamSidebarFilters"

export const Route = createFileRoute("/_app/thi-thu/")({
	component: ThiThuPage,
})

function ThiThuPage() {
	const [typeFilter, setTypeFilter] = useState<ExamType>("all")

	const allExams = [1, 2, 3, 4, 5, 6].map((i) => ({
		id: i,
		isPro: i % 2 === 0,
	}))

	const filteredExams = allExams.filter((exam) => {
		if (typeFilter === "pro") return exam.isPro
		if (typeFilter === "free") return !exam.isPro
		return true
	})

	return (
		<div className="mx-auto w-full max-w-5xl space-y-8 pb-10 pt-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold">Thư viện đề thi VSTEP</h1>
				<p className="text-sm text-muted-foreground">
					Luyện tập với hàng trăm đề thi bám sát cấu trúc thật.
				</p>
			</div>

			<section className="grid gap-4 md:grid-cols-2">
				<DashboardGoalCard />
				<DashboardStreakCard />
			</section>

			<section className="flex flex-col gap-8 md:flex-row md:items-start">
				<ExamSidebarFilters selectedType={typeFilter} onTypeChange={setTypeFilter} />

				<div className="flex-1 space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						{filteredExams.map((exam) => (
							<ExamCard key={exam.id} id={exam.id} isPro={exam.isPro} />
						))}
					</div>

					{filteredExams.length === 0 && (
						<div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
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
