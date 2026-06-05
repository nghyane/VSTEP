import { Link } from "@tanstack/react-router"
import { Icon } from "#/components/Icon"
import { modeLabel, statusLabel, statusTone } from "#/features/exam/components/result/helpers"
import type { SessionResultsData } from "#/features/exam/types"
import { cn } from "#/lib/utils"

export function ResultHeader({ result }: { readonly result: SessionResultsData }) {
	const tone = statusTone(result.summary.score_status)

	return (
		<header className="shrink-0 border-b border-border bg-surface/95 px-3 py-3 sm:px-5">
			<div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
				<div className="flex min-w-0 flex-1 items-center gap-3">
					<BackLink result={result} />
					<div className="min-w-0">
						<p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">Kết quả thi thử</p>
						<h1 className="mt-0.5 truncate text-base font-black text-foreground sm:text-lg">
							{result.exam?.title ?? "Đề thi thử không xác định"}
						</h1>
						<p className="text-xs font-bold text-muted">{modeLabel(result)}</p>
					</div>
				</div>
				<span
					className={cn("shrink-0 rounded-full border px-3 py-1 text-xs font-extrabold", toneClass(tone))}
				>
					{statusLabel(result.summary.score_status)}
				</span>
			</div>
		</header>
	)
}

function BackLink({ result }: { readonly result: SessionResultsData }) {
	const className =
		"inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted transition-colors hover:border-primary hover:text-primary"

	if (!result.exam) {
		return (
			<Link to="/thi-thu" className={className} aria-label="Quay lại danh sách đề thi">
				<Icon name="back" size="xs" />
			</Link>
		)
	}

	return (
		<Link
			to="/thi-thu/$examId"
			params={{ examId: result.exam.id }}
			className={className}
			aria-label="Quay lại đề thi"
		>
			<Icon name="back" size="xs" />
		</Link>
	)
}

function toneClass(tone: ReturnType<typeof statusTone>): string {
	if (tone === "success") return "border-success/35 bg-success/10 text-success"
	if (tone === "warning") return "border-warning/35 bg-warning/10 text-warning"
	if (tone === "danger") return "border-destructive/35 bg-destructive-tint text-destructive"
	return "border-border bg-background text-muted"
}
