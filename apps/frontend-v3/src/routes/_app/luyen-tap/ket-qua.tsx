import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { GradingHistory } from "#/features/practice/components/GradingHistory"

export const Route = createFileRoute("/_app/luyen-tap/ket-qua")({
	component: ResultsPage,
})

function ResultsPage() {
	return (
		<>
			<Header title="Kết quả AI chấm" backTo="/luyen-tap" />
			<div className="px-10 pb-12">
				<p className="text-sm text-subtle mb-5">Tổng hợp bài Viết và Nói đã được AI chấm điểm</p>
				<GradingHistory />
			</div>
		</>
	)
}
