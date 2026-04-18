import { Link } from "@tanstack/react-router"
import type { PhongThiResult } from "#/lib/practice/phong-thi-result"
import { cn } from "#/shared/lib/utils"
import { Button } from "#/shared/ui/button"
import { BullMascotCoin } from "./BullMascotCoin"
import { PerformanceTable } from "./PerformanceTable"

interface KetQuaCardProps {
	result: PhongThiResult
}

export function KetQuaCard({ result }: KetQuaCardProps) {
	return (
		// 3D card effect — section 11.1 skill-design.md
		<div className="mx-4 mb-24 mt-4 w-full max-w-3xl overflow-hidden rounded-2xl border-2 border-b-4 border-border border-b-slate-400 bg-card shadow-lg sm:mx-auto">
			{/* Congrats section */}
			<div className="flex items-center gap-6 px-8 py-6">
				<div className="shrink-0">
					<BullMascotCoin score={result.score} sizeClass="w-40 sm:w-52" />
				</div>

				<div className="min-w-0 flex-1">
					<p className="text-sm font-medium text-muted-foreground">Chúc mừng!</p>
					<p className="mt-0.5 truncate text-2xl font-bold text-foreground sm:text-3xl">
						{result.userName}
					</p>
					<p className="mt-1 text-sm text-muted-foreground">
						đã hoàn thành bài kiểm tra{" "}
						<span className="font-semibold text-foreground">{result.examTitle}</span>
					</p>

					{/* Score pills — plain style theo PREP (không border/bg) */}
					<div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
						<ScorePill
							value={result.totalCorrect}
							total={result.totalQuestions}
							label="Số câu đúng"
							variant="success"
						/>
						<ScorePill
							value={result.totalAnswered - result.totalCorrect}
							total={result.totalQuestions}
							label="Câu trả lời sai"
							variant="danger"
						/>
					</div>
				</div>
			</div>

			<div className="mx-6 h-px bg-border" />

			{/* Performance table */}
			<div className="px-6 py-5">
				<p className="mb-4 text-base font-semibold text-foreground">Performance</p>
				<PerformanceTable rows={result.questionTypes} />
			</div>

			{/* Action */}
			<div className="flex justify-center px-6 pb-7">
				<Button
					variant="outline"
					size="default"
					asChild
					className="rounded-full border-primary/30 px-10 text-primary hover:bg-primary/5 hover:text-primary"
				>
					<Link to="/phong-thi/$examId/chi-tiet" params={{ examId: result.examId }}>
						Xem chi tiết
					</Link>
				</Button>
			</div>
		</div>
	)
}

interface ScorePillProps {
	value: number
	total: number
	label: string
	variant: "success" | "danger"
}

// Ô số 3D + label nằm ngoài ô — Rule 0.4: items-baseline
function ScorePill({ value, total, label, variant }: ScorePillProps) {
	const isSuccess = variant === "success"
	return (
		<div className="inline-flex items-baseline gap-2">
			{/* Ô 3D chứa số */}
			<div
				className={cn(
					"inline-flex items-center rounded-xl border-2 border-b-[3px] px-3 py-1.5 shadow-sm",
					isSuccess
						? "border-emerald-200 border-b-emerald-400 bg-success/5"
						: "border-rose-200 border-b-rose-400 bg-destructive/5",
				)}
			>
				<span
					className={cn(
						"text-lg font-extrabold tabular-nums leading-none",
						isSuccess ? "text-success" : "text-destructive",
					)}
				>
					{value}/{total}
				</span>
			</div>
			{/* Label nằm ngoài ô */}
			<span className="text-xs text-muted-foreground">{label}</span>
		</div>
	)
}
