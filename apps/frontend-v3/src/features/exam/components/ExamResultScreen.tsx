import { Link } from "@tanstack/react-router"
import { Icon } from "#/components/Icon"
import { ScrollArea } from "#/components/ScrollArea"
import { ExamResultPerformanceTable } from "#/features/exam/components/ExamResultPerformanceTable"
import { LacCoinMascot } from "#/features/exam/components/LacCoinMascot"
import { ResultBackground } from "#/features/exam/components/ResultBackground"
import type { SessionResultsData } from "#/features/exam/types"
import { cn } from "#/lib/utils"

export function ExamResultScreen({
	result,
	examTitle,
	examId,
	sessionId,
}: {
	result: SessionResultsData
	examTitle: string
	examId: string
	sessionId: string
}) {
	const { mcq_score: mcqScore, mcq_total: mcqTotal, score_on_10: scoreOn10 } = result.summary
	const hasDetail = mcqTotal > 0 || result.writing_feedback.length > 0 || result.speaking_feedback.length > 0

	return (
		<div className="relative flex min-h-screen flex-col items-center overflow-hidden">
			<ResultBackground />

			<div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
				<Link
					to="/thi-thu"
					className="group inline-flex items-center gap-2.5 rounded-full border-2 border-b-4 border-white/50 bg-white/25 py-2 pl-2 pr-5 text-base font-extrabold text-white shadow-lg backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/35 active:translate-y-0 active:border-b-2"
				>
					<span className="flex size-7 items-center justify-center rounded-full border-2 border-b-[3px] border-coin-dark bg-coin shadow-inner transition-transform group-hover:rotate-12">
						<Icon name="check" size="xs" className="text-white" />
					</span>
					Hoàn thành
				</Link>
			</div>

			<div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 py-10">
				<h1 className="mb-5 text-xl font-extrabold text-white drop-shadow-sm">Kết quả</h1>

				<div className="w-full max-w-3xl overflow-hidden rounded-(--radius-banner) border-2 border-b-4 border-white/20 bg-white shadow-2xl">
					<div className="flex items-center gap-5 px-8 py-6">
						<LacCoinMascot score={scoreOn10} className="w-40 shrink-0 sm:w-52" />

						<div className="min-w-0 flex-1">
							<p className="text-sm text-subtle">Chúc mừng!</p>
							<p className="mt-0.5 text-2xl font-extrabold text-foreground sm:text-3xl">Thí sinh</p>
							<p className="mt-1 text-sm text-muted">
								đã hoàn thành bài kiểm tra <span className="font-bold text-foreground">{examTitle}</span>
							</p>

							<div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
								<ScorePill value={mcqScore} total={mcqTotal} label="Số câu đúng" variant="success" />
								<ScorePill
									value={mcqTotal - mcqScore}
									total={mcqTotal}
									label="Câu trả lời sai"
									variant="danger"
								/>
							</div>
						</div>
					</div>

					<div className="mx-6 h-px bg-border" />

					<div className="px-6 py-5">
						<p className="mb-4 text-base font-extrabold text-foreground">Performance</p>
						<ScrollArea
							className="rounded-(--radius-card) border-2 border-b-4 border-border"
							maxHeight={320}
							thumbClassName="w-1.5 bg-placeholder/70 hover:bg-subtle"
						>
							<ExamResultPerformanceTable rows={result.performance_rows} />
						</ScrollArea>
						{result.summary.has_pending_ai && (
							<div className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-warning/40 bg-warning/10 px-3 py-1.5">
								<span className="relative flex size-1.5 shrink-0">
									<span className="absolute inline-flex size-full animate-ping rounded-full bg-warning opacity-60" />
									<span className="relative inline-flex size-1.5 rounded-full bg-warning" />
								</span>
								<span className="text-[11px] font-extrabold text-foreground">
									AI đang chấm — bạn có thể quay về sảnh, kết quả sẽ tự cập nhật
								</span>
							</div>
						)}
					</div>

					<div className="flex flex-wrap justify-center gap-3 px-6 pb-7">
						<Link to="/thi-thu" className="btn btn-secondary">
							Về danh sách đề
						</Link>
						{hasDetail && (
							<Link
								to="/phong-thi/$sessionId/chi-tiet"
								params={{ sessionId }}
								search={{ examId }}
								className="btn btn-primary"
							>
								Xem chi tiết
								<Icon name="lightning" size="xs" className="text-white" />
							</Link>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

function ScorePill({
	value,
	total,
	label,
	variant,
}: {
	value: number
	total: number
	label: string
	variant: "success" | "danger"
}) {
	const isSuccess = variant === "success"
	return (
		<div className="inline-flex items-baseline gap-2">
			<div
				className={cn(
					"inline-flex items-center rounded-(--radius-button) border-2 border-b-4 px-3 py-1",
					isSuccess ? "border-primary/30 bg-primary-tint" : "border-destructive/30 bg-destructive-tint",
				)}
			>
				<span
					className={cn(
						"text-lg font-extrabold tabular-nums leading-none",
						isSuccess ? "text-primary" : "text-destructive",
					)}
				>
					{value}/{total}
				</span>
			</div>
			<span className="text-xs text-muted">{label}</span>
		</div>
	)
}
