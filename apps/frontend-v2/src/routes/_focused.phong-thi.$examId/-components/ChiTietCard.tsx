import { Link } from "@tanstack/react-router"
import { CheckCircle2, XCircle } from "lucide-react"
import type { PhongThiResult, QuestionTypeResult } from "#/lib/practice/phong-thi-result"
import { cn } from "#/lib/utils"

interface ChiTietCardProps {
	result: PhongThiResult
}

export function ChiTietCard({ result }: ChiTietCardProps) {
	return (
		<div className="mx-4 mb-24 mt-4 w-full max-w-3xl overflow-hidden rounded-2xl border-2 border-b-4 border-border border-b-slate-400 bg-card shadow-lg sm:mx-auto">
			{/* Header */}
			<div className="border-b border-border px-6 py-5">
				<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					{result.examTitle}
				</p>
				<div className="mt-1 flex items-baseline gap-3">
					<span className="text-3xl font-extrabold tabular-nums text-foreground">
						{result.score.toFixed(1)}
					</span>
					<span className="text-sm text-muted-foreground">
						điểm · {result.totalCorrect}/{result.totalQuestions} câu đúng
					</span>
				</div>
			</div>

			{/* Chi tiết từng loại câu hỏi */}
			<div className="divide-y divide-border/60">
				{result.questionTypes.map((qt) => (
					<QuestionTypeBlock key={qt.label} qt={qt} />
				))}
			</div>

			{/* Back */}
			<div className="flex justify-center border-t border-border px-6 py-5">
				<Link
					to="/phong-thi/$examId/ket-qua"
					params={{ examId: result.examId }}
					className="text-sm font-medium text-primary hover:underline"
				>
					← Quay lại kết quả
				</Link>
			</div>
		</div>
	)
}

function QuestionTypeBlock({ qt }: { qt: QuestionTypeResult }) {
	const mockItems = buildMockItems(qt)

	return (
		<div className="px-6 py-4">
			{/* Header loại */}
			<div className="mb-3 flex items-center justify-between">
				<span className="text-sm font-semibold text-foreground">{qt.label}</span>
				<span className="text-xs tabular-nums text-muted-foreground">
					{qt.correct}/{qt.total} đúng
				</span>
			</div>

			{/* Item rows */}
			<div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
				{mockItems.map((item) => (
					<div
						key={item.no}
						className={cn(
							"flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm",
							item.correct
								? "border-emerald-100 bg-success/5 text-foreground"
								: "border-rose-100 bg-destructive/5 text-foreground",
						)}
					>
						{item.correct ? (
							<CheckCircle2 className="size-4 shrink-0 text-success" />
						) : (
							<XCircle className="size-4 shrink-0 text-destructive" />
						)}
						<span className="font-medium">Câu {item.no}</span>
						<span className="ml-auto text-xs text-muted-foreground">
							{item.correct ? "Đúng" : "Sai"}
						</span>
					</div>
				))}
			</div>
		</div>
	)
}

// Sinh mock item đúng/sai dựa theo số correct đã biết
function buildMockItems(qt: QuestionTypeResult): { no: number; correct: boolean }[] {
	return Array.from({ length: qt.total }, (_, i) => ({
		no: i + 1,
		correct: i < qt.correct,
	}))
}
