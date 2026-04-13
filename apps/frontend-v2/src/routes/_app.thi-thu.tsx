import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { DashboardGoalCard } from "./-components/thi-thu/DashboardGoalCard"
import { DashboardStreakCard } from "./-components/thi-thu/DashboardStreakCard"
import { ExamCard } from "./-components/thi-thu/ExamCard"
import { ExamSidebarFilters, type ExamType } from "./-components/thi-thu/ExamSidebarFilters"

export const Route = createFileRoute("/_app/thi-thu")({
	component: ThiThuPage,
})

function ThiThuPage() {
	const [typeFilter, setTypeFilter] = useState<ExamType>("all")

	// Tạo dữ liệu giả lập (mock data)
	const allExams = [1, 2, 3, 4, 5, 6].map((i) => ({
		id: i,
		isPro: i % 2 === 0, // Các thẻ có id chẵn sẽ là thẻ Pro
	}))

	// Lọc dữ liệu dựa trên tab đang chọn
	const filteredExams = allExams.filter((exam) => {
		if (typeFilter === "pro") return exam.isPro
		if (typeFilter === "free") return !exam.isPro
		return true // "all"
	})

	return (
		<div className="mx-auto w-full max-w-5xl space-y-8 pb-10 pt-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold">Thư viện đề thi VSTEP</h1>
				<p className="text-sm text-muted-foreground">
					Luyện tập với hàng trăm đề thi bám sát cấu trúc thật.
				</p>
			</div>

			{/* KHU VỰC A: TOP DASHBOARD */}
			<section className="grid gap-4 md:grid-cols-2">
				<DashboardGoalCard />
				<DashboardStreakCard />
			</section>

			{/* KHU VỰC B: MAIN LAYOUT (2 CỘT) */}
			<section className="flex flex-col gap-8 md:flex-row md:items-start">
				{/* Sidebar Lọc (Bên trái) */}
				<ExamSidebarFilters selectedType={typeFilter} onTypeChange={setTypeFilter} />

				{/* Lưới đề thi (Bên phải) */}
				<div className="flex-1 space-y-4">
					{/* Grid Exam Cards */}
					<div className="grid gap-4 sm:grid-cols-2">
						{filteredExams.map((exam) => (
							<ExamCard key={exam.id} id={exam.id} isPro={exam.isPro} />
						))}
					</div>

					{/* State trống khi lọc không có kết quả */}
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
