import type { Improvement, Rewrite } from "#/features/grading/types"

interface FeedbackProps {
	strengths: string[]
	improvements: Improvement[]
}

export function FeedbackSection({ strengths, improvements }: FeedbackProps) {
	return (
		<div className="space-y-4">
			{strengths.length > 0 && (
				<div>
					<p className="text-xs font-bold text-success uppercase tracking-wide mb-2">Điểm mạnh</p>
					<ul className="space-y-1.5">
						{strengths.map((s) => (
							<li key={s} className="flex gap-2 text-sm text-foreground">
								<span className="text-success shrink-0">✓</span>
								{s}
							</li>
						))}
					</ul>
				</div>
			)}
			{improvements.length > 0 && (
				<div>
					<p className="text-xs font-bold text-warning uppercase tracking-wide mb-2">Cần cải thiện</p>
					<ul className="space-y-2">
						{improvements.map((item) => (
							<li key={item.message} className="text-sm">
								<p className="font-bold text-foreground">{item.message}</p>
								<p className="text-subtle mt-0.5">{item.explanation}</p>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	)
}

interface RewriteProps {
	rewrites: Rewrite[]
}

export function RewriteSection({ rewrites }: RewriteProps) {
	if (rewrites.length === 0) return null

	return (
		<div>
			<p className="text-xs font-bold text-info uppercase tracking-wide mb-2">Gợi ý viết lại</p>
			<div className="space-y-3">
				{rewrites.map((r) => (
					<div key={r.original} className="text-sm space-y-1 p-3 bg-background rounded-lg">
						<p className="text-destructive line-through">{r.original}</p>
						<p className="text-success font-medium">{r.improved}</p>
						<p className="text-subtle text-xs">{r.reason}</p>
					</div>
				))}
			</div>
		</div>
	)
}
