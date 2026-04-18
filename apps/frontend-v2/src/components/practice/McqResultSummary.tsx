// McqResultSummary — card tổng kết hiện ở đầu trang sau khi submit MCQ.

import { cn } from "#/shared/lib/utils"

interface Props {
	score: number
	total: number
}

export function McqResultSummary({ score, total }: Props) {
	const pct = total > 0 ? Math.round((score / total) * 100) : 0
	const label = pct >= 80 ? "Xuất sắc!" : pct >= 50 ? "Khá ổn, luyện thêm nhé." : "Cần ôn lại."

	return (
		<div className="rounded-2xl border bg-card p-6 shadow-sm">
			<div className="flex items-center gap-6">
				<ScoreCircle score={score} total={total} pct={pct} />
				<div className="min-w-0 flex-1">
					<p className="text-lg font-bold">Kết quả</p>
					<p className="mt-1 text-sm text-muted-foreground">
						Đúng{" "}
						<strong className="text-foreground">
							{score}/{total}
						</strong>{" "}
						câu
					</p>
					<p
						className={cn(
							"mt-1 text-sm font-medium",
							pct >= 80 ? "text-success" : pct >= 50 ? "text-primary" : "text-warning",
						)}
					>
						{label}
					</p>
				</div>
			</div>
		</div>
	)
}

function ScoreCircle({ score, total, pct }: { score: number; total: number; pct: number }) {
	const color = pct >= 80 ? "text-success" : pct >= 50 ? "text-primary" : "text-warning"
	const dashPct = Math.max(0, Math.min(100, pct))

	return (
		<div className="relative flex size-20 shrink-0 items-center justify-center">
			<svg viewBox="0 0 36 36" className="size-20 -rotate-90" aria-hidden="true">
				<circle cx="18" cy="18" r="15.5" className="fill-none stroke-muted" strokeWidth="3" />
				<circle
					cx="18"
					cy="18"
					r="15.5"
					className={cn("fill-none", color)}
					stroke="currentColor"
					strokeWidth="3"
					strokeDasharray={`${(dashPct / 100) * 97.4} 97.4`}
					strokeLinecap="round"
				/>
			</svg>
			<div className="absolute text-center">
				<p className={cn("text-lg font-bold tabular-nums leading-none", color)}>
					{score}/{total}
				</p>
				<p className="mt-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
					{pct}%
				</p>
			</div>
		</div>
	)
}
