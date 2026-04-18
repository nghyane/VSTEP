import { Link } from "@tanstack/react-router"
import { CheckCircle2, XCircle } from "lucide-react"
import type {
	PhongThiResult,
	QuestionItemResult,
	QuestionTypeResult,
} from "#/features/practice/lib/phong-thi-result"
import { cn } from "#/shared/lib/utils"

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
	const isMcq = qt.items.length > 0 && qt.items[0]?.correctLetter !== ""

	return (
		<div className="px-6 py-4">
			<div className="mb-3 flex items-center justify-between">
				<span className="text-sm font-semibold text-foreground">{qt.label}</span>
				<span className="text-xs tabular-nums text-muted-foreground">
					{qt.correct}/{qt.total} đúng
				</span>
			</div>

			<div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
				{qt.items.map((item) =>
					isMcq ? (
						<McqItemRow key={item.no} item={item} />
					) : (
						<NonMcqItemRow key={item.no} item={item} />
					),
				)}
			</div>
		</div>
	)
}

function McqItemRow({ item }: { item: QuestionItemResult }) {
	const { correct, answered } = item

	return (
		<div
			className={cn(
				"flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
				correct
					? "border-emerald-100 bg-success/5"
					: answered
						? "border-rose-100 bg-destructive/5"
						: "border-border bg-muted/30",
			)}
		>
			{correct ? (
				<CheckCircle2 className="size-4 shrink-0 text-success" />
			) : (
				<XCircle
					className={cn("size-4 shrink-0", answered ? "text-destructive" : "text-muted-foreground")}
				/>
			)}

			<span className="font-medium text-foreground">Câu {item.no}</span>

			{/* Đáp án thí sinh + đáp án đúng */}
			<div className="ml-auto flex items-center gap-1.5">
				{/* Đáp án thí sinh chọn */}
				<span
					className={cn(
						"inline-flex size-6 items-center justify-center rounded-md border text-xs font-bold",
						!answered
							? "border-border bg-muted text-muted-foreground"
							: correct
								? "border-emerald-200 bg-success/10 text-success"
								: "border-rose-200 bg-destructive/10 text-destructive",
					)}
					title="Đáp án của bạn"
				>
					{item.userLetter}
				</span>

				{/* Mũi tên + đáp án đúng — chỉ hiện khi sai hoặc chưa trả lời */}
				{!correct && (
					<>
						<span className="text-xs text-muted-foreground">→</span>
						<span
							className="inline-flex size-6 items-center justify-center rounded-md border border-emerald-200 bg-success/10 text-xs font-bold text-success"
							title="Đáp án đúng"
						>
							{item.correctLetter}
						</span>
					</>
				)}
			</div>
		</div>
	)
}

function NonMcqItemRow({ item }: { item: QuestionItemResult }) {
	return (
		<div
			className={cn(
				"flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm",
				item.correct ? "border-emerald-100 bg-success/5" : "border-border bg-muted/30",
			)}
		>
			{item.correct ? (
				<CheckCircle2 className="size-4 shrink-0 text-success" />
			) : (
				<XCircle className="size-4 shrink-0 text-muted-foreground" />
			)}
			<span className="font-medium text-foreground">Phần {item.no}</span>
			<span className="ml-auto text-xs text-muted-foreground">
				{item.correct ? "Hoàn thành" : "Chưa làm"}
			</span>
		</div>
	)
}
