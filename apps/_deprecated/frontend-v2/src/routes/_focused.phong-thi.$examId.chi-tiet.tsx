import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { buildMockResult, loadPhongThiResult } from "#/features/practice/lib/phong-thi-result"
import { ChiTietCard } from "./_focused.phong-thi.$examId/-components/ChiTietCard"
import { ResultPageLayout } from "./_focused.phong-thi.$examId/-components/ResultPageLayout"

export const Route = createFileRoute("/_focused/phong-thi/$examId/chi-tiet")({
	component: ChiTietPage,
})

function ChiTietPage() {
	const { examId } = Route.useParams()
	const result = loadPhongThiResult(examId) ?? buildMockResult(examId)

	return (
		<ResultPageLayout headerSlot={<ChiTietHeader examId={examId} />}>
			<ChiTietCard result={result} />
		</ResultPageLayout>
	)
}

function ChiTietHeader({ examId }: { examId: string }) {
	return (
		<div className="relative flex items-center justify-center px-4 pt-4">
			<Link
				to="/phong-thi/$examId/ket-qua"
				params={{ examId }}
				className="absolute left-4 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/15"
			>
				<ArrowLeft className="size-4" />
				Kết quả
			</Link>
			<h1 className="text-xl font-bold text-white drop-shadow sm:text-2xl">Chi tiết</h1>
		</div>
	)
}
