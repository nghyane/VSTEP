import { createFileRoute } from "@tanstack/react-router"
import { DashboardGoalCard } from "./-components/thi-thu/DashboardGoalCard"
import { DashboardStreakCard } from "./-components/thi-thu/DashboardStreakCard"
import { ExamCard } from "./-components/thi-thu/ExamCard"
import { ExamSidebarFilters } from "./-components/thi-thu/ExamSidebarFilters"

export const Route = createFileRoute("/_app/thi-thu")({
	component: ThiThuPage,
})

function ThiThuPage() {
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
				<ExamSidebarFilters />

				{/* Lưới đề thi (Bên phải) */}
				<div className="flex-1 space-y-4">
					{/* Grid Exam Cards */}
					<div className="grid gap-4 sm:grid-cols-2">
						{[1, 2, 3, 4, 5, 6].map((i) => (
							<ExamCard key={i} id={i} isPro={i % 2 === 0} />
						))}
					</div>
				</div>
			</section>
		</div>
	)
}
