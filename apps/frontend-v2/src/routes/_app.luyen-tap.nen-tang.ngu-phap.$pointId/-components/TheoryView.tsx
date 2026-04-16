import type { GrammarPoint } from "#/lib/mock/grammar"

interface Props {
	point: GrammarPoint
}

export function TheoryView({ point }: Props) {
	return (
		<div className="space-y-6">
			{/* Khi nào dùng + Cấu trúc — gộp 1 block */}
			<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
				<div>
					<h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Khi nào dùng
					</h2>
					<p className="mt-2 text-sm leading-relaxed text-foreground/90">{point.whenToUse}</p>
				</div>
				<div>
					<h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Cấu trúc
					</h2>
					<ul className="mt-2 space-y-2">
						{point.structures.map((s) => (
							<li
								key={s}
								className="rounded-lg bg-muted/60 px-4 py-2.5 font-mono text-sm text-foreground"
							>
								{s}
							</li>
						))}
					</ul>
				</div>
			</section>

			{/* Ví dụ */}
			<section className="rounded-2xl border bg-card p-6 shadow-sm">
				<h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Ví dụ
				</h2>
				<ul className="mt-3 space-y-4">
					{point.examples.map((ex) => (
						<li key={ex.en} className="border-l-2 border-primary/50 pl-4">
							<p className="text-sm font-semibold text-foreground">{ex.en}</p>
							<p className="mt-0.5 text-xs text-muted-foreground">{ex.vi}</p>
							{ex.note && <p className="mt-1 text-xs text-primary">· {ex.note}</p>}
						</li>
					))}
				</ul>
			</section>

			{/* Lỗi thường gặp */}
			{point.commonMistakes.length > 0 && (
				<section className="rounded-2xl border bg-card p-6 shadow-sm">
					<h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Lỗi thường gặp
					</h2>
					<ul className="mt-3 space-y-3">
						{point.commonMistakes.map((m) => (
							<li key={m.wrong} className="rounded-xl overflow-hidden border">
								<div className="bg-destructive/5 px-4 py-2.5">
									<p className="text-sm text-destructive">✗ {m.wrong}</p>
								</div>
								<div className="bg-success/5 px-4 py-2.5">
									<p className="text-sm font-medium text-success">✓ {m.correct}</p>
								</div>
								<div className="px-4 py-2.5">
									<p className="text-xs text-muted-foreground">{m.explanation}</p>
								</div>
							</li>
						))}
					</ul>
				</section>
			)}
		</div>
	)
}
