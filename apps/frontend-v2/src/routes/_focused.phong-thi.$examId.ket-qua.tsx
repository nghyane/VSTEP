import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { CheckCircle2 } from "lucide-react"
import { Button } from "#/components/ui/button"
import { buildMockResult, loadPhongThiResult } from "#/lib/practice/phong-thi-result"
import { KetQuaCard } from "./_focused.phong-thi.$examId/-components/KetQuaCard"
import { ResultPageLayout } from "./_focused.phong-thi.$examId/-components/ResultPageLayout"

export const Route = createFileRoute("/_focused/phong-thi/$examId/ket-qua")({
	component: KetQuaPage,
})

function KetQuaPage() {
	const { examId } = Route.useParams()
	const navigate = useNavigate()

	// sessionStorage đồng bộ — đọc trực tiếp, không cần useState/useEffect
	const result = loadPhongThiResult(examId) ?? buildMockResult(examId)

	return (
		<ResultPageLayout headerSlot={<PageHeader onComplete={() => navigate({ to: "/thi-thu" })} />}>
			<KetQuaCard result={result} />
		</ResultPageLayout>
	)
}

interface PageHeaderProps {
	onComplete: () => void
}

function PageHeader({ onComplete }: PageHeaderProps) {
	return (
		<div className="flex items-center justify-center px-4 pt-4">
			<h1 className="flex-1 text-center text-xl font-bold text-white drop-shadow sm:text-2xl">
				Kết quả
			</h1>
			<div className="absolute right-4 top-4">
				<Button
					variant="outline"
					size="sm"
					onClick={onComplete}
					className="border-white/40 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 hover:text-white"
				>
					<CheckCircle2 className="size-4" />
					Hoàn thành
				</Button>
			</div>
		</div>
	)
}
