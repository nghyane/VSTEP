import { Link } from "@tanstack/react-router"
import { Icon } from "#/components/Icon"
import type { SessionResultsData } from "#/features/exam/types"

export function ResultHeader({ result }: { readonly result: SessionResultsData }) {
	return (
		<header className="sticky top-0 z-10 shrink-0 bg-background px-4 pb-4 pt-6 sm:px-6 lg:px-10">
			<div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
				<div className="flex min-w-0 flex-1 items-center gap-3">
					<BackLink result={result} />
					<div className="min-w-0">
						<p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">Kết quả thi thử</p>
						<h1 className="mt-0.5 truncate text-base font-black text-foreground sm:text-lg">
							{result.exam?.title ?? "Đề thi thử không xác định"}
						</h1>
					</div>
				</div>
			</div>
		</header>
	)
}

function BackLink({ result }: { readonly result: SessionResultsData }) {
	const className =
		"-ml-2 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:text-primary"

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
